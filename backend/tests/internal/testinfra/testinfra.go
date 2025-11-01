package testinfra

import (
	"bufio"
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"

	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/isc"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/rabbitmq"
	mqtt "github.com/eclipse/paho.mqtt.golang"
	influxdb2 "github.com/influxdata/influxdb-client-go/v2"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"
)

const (
	rabbitMQImage  = "rabbitmq:3-management"
	mosquittoImage = "eclipse-mosquitto:latest"
	influxImage    = "influxdb:2.7-alpine"

	defaultMQTTUsername = "admin"
	defaultMQTTPassword = "password"
	defaultMQTTTopic    = "topic"

	influxOrganization = "jiap"
	influxBucket       = "jiap-time-series"
	influxAdminUser    = "user"
	influxAdminPass    = "password"
	influxSetupToken   = "riot-integration-token"
)

// Logger is a minimal logging interface satisfied by testing.T.
type Logger interface {
	Logf(format string, args ...any)
}

// Infrastructure orchestrates testcontainers instances and helper utilities
// required for exercising the backend pipeline end-to-end.
type Infrastructure struct {
	repoRoot string
	buildDir string

	containers  []testcontainers.Container
	backendStub *httptest.Server

	rabbitmqURL   string
	mqttBrokerURL string
	mqttUsername  string
	mqttPassword  string
	mqttTopic     string

	influxURL    string
	influxToken  string
	influxOrg    string
	influxBucket string

	backendURL string
}

// Start spins up the dependency containers and returns Infrastructure for tests.
func Start(ctx context.Context) (*Infrastructure, error) {
	repoRoot, err := locateRepoRoot()
	if err != nil {
		return nil, err
	}

	buildDir, err := os.MkdirTemp("", "riot-integration-build-*")
	if err != nil {
		return nil, fmt.Errorf("create build directory: %w", err)
	}

	containers := make([]testcontainers.Container, 0, 3)
	cleanupOnErr := func() {
		terminateContainers(context.Background(), containers)
		_ = os.RemoveAll(buildDir)
	}

	rabbitContainer, rabbitURL, err := startRabbitMQ(ctx)
	if err != nil {
		cleanupOnErr()
		return nil, err
	}
	containers = append(containers, rabbitContainer)

	mqttContainer, mqttURL, err := startMosquitto(ctx, repoRoot)
	if err != nil {
		cleanupOnErr()
		return nil, err
	}
	containers = append(containers, mqttContainer)

	influxContainer, influxURL, err := startInfluxDB(ctx)
	if err != nil {
		cleanupOnErr()
		return nil, err
	}
	containers = append(containers, influxContainer)

	backendStub := startBackendStub()

	infra := &Infrastructure{
		repoRoot:    repoRoot,
		buildDir:    buildDir,
		containers:  containers,
		backendStub: backendStub,

		rabbitmqURL:   rabbitURL,
		mqttBrokerURL: mqttURL,
		mqttUsername:  defaultMQTTUsername,
		mqttPassword:  defaultMQTTPassword,
		mqttTopic:     defaultMQTTTopic,

		influxURL:    influxURL,
		influxToken:  influxSetupToken,
		influxOrg:    influxOrganization,
		influxBucket: influxBucket,

		backendURL: backendStub.URL,
	}

	// Ensure helpers run with the same RabbitMQ URL as the services.
	if err := os.Setenv("RABBITMQ_URL", infra.rabbitmqURL); err != nil {
		_ = infra.Close(context.Background())
		return nil, fmt.Errorf("set RABBITMQ_URL: %w", err)
	}
	if err := os.Setenv("BACKEND_CORE_URL", infra.backendURL); err != nil {
		_ = infra.Close(context.Background())
		return nil, fmt.Errorf("set BACKEND_CORE_URL: %w", err)
	}

	return infra, nil
}

// Close tears down containers and temporary artifacts created by Start.
func (i *Infrastructure) Close(ctx context.Context) error {
	if ctx == nil {
		ctx = context.Background()
	}

	if i.backendStub != nil {
		i.backendStub.Close()
	}

	terminateErr := terminateContainers(ctx, i.containers)
	removeErr := os.RemoveAll(i.buildDir)

	return errors.Join(terminateErr, removeErr)
}

// BuildMainPackage compiles the service binary located in relativePath (from repo root).
func (i *Infrastructure) BuildMainPackage(ctx context.Context, relativePath string) (string, error) {
	outputPath := filepath.Join(i.buildDir, filepath.Base(relativePath))

	cmd := exec.CommandContext(ctx, "go", "build", "-o", outputPath, "./src")
	cmd.Dir = filepath.Join(i.repoRoot, relativePath)
	cmd.Env = append(os.Environ(), fmt.Sprintf("GOWORK=%s", filepath.Join(i.repoRoot, "go.work")))

	var combined bytes.Buffer
	cmd.Stdout = &combined
	cmd.Stderr = &combined

	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("go build %s failed: %w\n%s", relativePath, err, combined.String())
	}

	return outputPath, nil
}

// SetupQueues declares RabbitMQ queues required by the services.
func (i *Infrastructure) SetupQueues() {
	client := rabbitmq.NewClient()
	defer client.Dispose()
	isc.SetupRabbitMQInfrastructureForISC(client)
}

// MQTTPReprocessorEnv returns environment variables for the MQTT preprocessor service.
func (i *Infrastructure) MQTTPReprocessorEnv() []string {
	return i.envWith(map[string]string{
		"BACKEND_CORE_URL":     i.backendURL,
		"RABBITMQ_URL":         i.rabbitmqURL,
		"MQTT_BROKER_URL":      i.mqttBrokerURL,
		"MQTT_BROKER_USERNAME": i.mqttUsername,
		"MQTT_BROKER_PASSWORD": i.mqttPassword,
		"MQTT_TOPIC":           i.mqttTopic,
	})
}

// TimeSeriesStoreEnv returns environment variables for the time-series-store service.
func (i *Infrastructure) TimeSeriesStoreEnv() []string {
	return i.envWith(map[string]string{
		"BACKEND_CORE_URL":    i.backendURL,
		"RABBITMQ_URL":        i.rabbitmqURL,
		"INFLUX_URL":          i.influxURL,
		"INFLUX_TOKEN":        i.influxToken,
		"INFLUX_ORGANIZATION": i.influxOrg,
		"INFLUX_BUCKET":       i.influxBucket,
	})
}

// PublishMQTT publishes payload to the configured MQTT topic using QoS 1.
func (i *Infrastructure) PublishMQTT(ctx context.Context, payload []byte) error {
	opts := mqtt.NewClientOptions().
		AddBroker(i.mqttBrokerURL).
		SetClientID(fmt.Sprintf("integration-test-%d", time.Now().UnixNano())).
		SetUsername(i.mqttUsername).
		SetPassword(i.mqttPassword)

	client := mqtt.NewClient(opts)
	connectToken := client.Connect()
	if !connectToken.WaitTimeout(10 * time.Second) {
		return errors.New("timeout connecting to MQTT broker")
	}
	if err := connectToken.Error(); err != nil {
		return fmt.Errorf("connect to MQTT broker: %w", err)
	}
	defer client.Disconnect(250)

	publishToken := client.Publish(i.mqttTopic, 1, false, payload)
	if !publishToken.WaitTimeout(10 * time.Second) {
		return errors.New("timeout publishing MQTT message")
	}
	return publishToken.Error()
}

// InfluxHasMeasurement returns true once at least one point exists for the measurement.
func (i *Infrastructure) InfluxHasMeasurement(ctx context.Context, measurement string) (bool, error) {
	client := influxdb2.NewClient(i.influxURL, i.influxToken)
	defer client.Close()

	queryAPI := client.QueryAPI(i.influxOrg)
	flux := fmt.Sprintf(`
from(bucket: "%s")
  |> range(start: -5m)
  |> filter(fn: (r) => r["_measurement"] == "%s")
  |> limit(n: 1)
`, i.influxBucket, measurement)

	result, err := queryAPI.Query(ctx, flux)
	if err != nil {
		return false, fmt.Errorf("query influx: %w", err)
	}

	for result.Next() {
		return true, nil
	}

	if result.Err() != nil {
		return false, fmt.Errorf("flux error: %w", result.Err())
	}

	return false, nil
}

// StartService spawns the given binary and watches its logs for readySignal.
func (i *Infrastructure) StartService(ctx context.Context, logger Logger, name, binaryPath, readySignal string, env []string) (*ServiceProcess, error) {
	serviceCtx, cancel := context.WithCancel(ctx)
	cmd := exec.CommandContext(serviceCtx, binaryPath)
	cmd.Env = env
	cmd.Dir = i.repoRoot

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		cancel()
		return nil, fmt.Errorf("stdout pipe for %s: %w", name, err)
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		cancel()
		_ = stdout.Close()
		return nil, fmt.Errorf("stderr pipe for %s: %w", name, err)
	}

	if err := cmd.Start(); err != nil {
		cancel()
		_ = stdout.Close()
		_ = stderr.Close()
		return nil, fmt.Errorf("start %s: %w", name, err)
	}

	process := &ServiceProcess{
		name:        name,
		cmd:         cmd,
		cancel:      cancel,
		readySignal: readySignal,
		readyCh:     make(chan struct{}),
		exitCh:      make(chan struct{}),
		logger:      logger,
	}

	if readySignal == "" {
		process.markReady()
	}

	go process.capture(stdout, "stdout")
	go process.capture(stderr, "stderr")

	go func() {
		err := cmd.Wait()
		process.exitOnce.Do(func() {
			process.exitErr = err
			close(process.exitCh)
		})
	}()

	return process, nil
}

func (i *Infrastructure) envWith(values map[string]string) []string {
	env := os.Environ()
	for key, value := range values {
		env = append(env, fmt.Sprintf("%s=%s", key, value))
	}
	return env
}

type ServiceProcess struct {
	name        string
	cmd         *exec.Cmd
	cancel      context.CancelFunc
	readySignal string
	readyOnce   sync.Once
	readyCh     chan struct{}
	exitOnce    sync.Once
	exitCh      chan struct{}
	exitErr     error
	logger      Logger
}

func (s *ServiceProcess) WaitReady(ctx context.Context) error {
	select {
	case <-s.readyCh:
		return nil
	case <-s.exitCh:
		return fmt.Errorf("%s stopped before reporting ready: %w", s.name, s.exitErr)
	case <-ctx.Done():
		return ctx.Err()
	}
}

func (s *ServiceProcess) Stop(ctx context.Context) error {
	s.cancel()
	select {
	case <-s.exitCh:
		return filterProcessExitError(s.exitErr)
	case <-ctx.Done():
		return ctx.Err()
	}
}

func (s *ServiceProcess) capture(reader io.ReadCloser, stream string) {
	defer reader.Close()
	scanner := bufio.NewScanner(reader)
	for scanner.Scan() {
		line := scanner.Text()
		if s.logger != nil {
			s.logger.Logf("[%s][%s] %s", s.name, stream, line)
		}
		if s.readySignal != "" && strings.Contains(line, s.readySignal) {
			s.markReady()
		}
	}
	if err := scanner.Err(); err != nil && s.logger != nil {
		s.logger.Logf("[%s][%s] capture error: %v", s.name, stream, err)
	}
}

func (s *ServiceProcess) markReady() {
	s.readyOnce.Do(func() {
		close(s.readyCh)
	})
}

func filterProcessExitError(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, context.Canceled) {
		return nil
	}
	var exitErr *exec.ExitError
	if errors.As(err, &exitErr) {
		if exitErr.ExitCode() == -1 {
			return nil
		}
	}
	return err
}

func startRabbitMQ(ctx context.Context) (testcontainers.Container, string, error) {
	req := testcontainers.ContainerRequest{
		Image:        rabbitMQImage,
		ExposedPorts: []string{"5672/tcp"},
		WaitingFor:   wait.ForListeningPort("5672/tcp").WithStartupTimeout(2 * time.Minute),
	}
	container, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: req,
		Started:          true,
	})
	if err != nil {
		return nil, "", fmt.Errorf("start RabbitMQ: %w", err)
	}
	host, err := container.Host(ctx)
	if err != nil {
		_ = container.Terminate(ctx)
		return nil, "", fmt.Errorf("rabbitmq host: %w", err)
	}
	port, err := container.MappedPort(ctx, "5672")
	if err != nil {
		_ = container.Terminate(ctx)
		return nil, "", fmt.Errorf("rabbitmq port: %w", err)
	}
	url := fmt.Sprintf("amqp://guest:guest@%s:%s/", host, port.Port())
	return container, url, nil
}

func startMosquitto(ctx context.Context, repoRoot string) (testcontainers.Container, string, error) {
	configPath := filepath.Join(repoRoot, "docker", "mosquitto-config", "mosquitto.conf")
	passwordPath := filepath.Join(repoRoot, "docker", "mosquitto-config", "password.txt")

	req := testcontainers.ContainerRequest{
		Image:        mosquittoImage,
		ExposedPorts: []string{"1883/tcp"},
		Files: []testcontainers.ContainerFile{
			{
				HostFilePath:      configPath,
				ContainerFilePath: "/mosquitto/config/mosquitto.conf",
				FileMode:          0o644,
			},
			{
				HostFilePath:      passwordPath,
				ContainerFilePath: "/mosquitto/config/password.txt",
				FileMode:          0o600,
			},
		},
		WaitingFor: wait.ForListeningPort("1883/tcp").WithStartupTimeout(1 * time.Minute),
	}
	container, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: req,
		Started:          true,
	})
	if err != nil {
		return nil, "", fmt.Errorf("start Mosquitto: %w", err)
	}
	host, err := container.Host(ctx)
	if err != nil {
		_ = container.Terminate(ctx)
		return nil, "", fmt.Errorf("mosquitto host: %w", err)
	}
	port, err := container.MappedPort(ctx, "1883")
	if err != nil {
		_ = container.Terminate(ctx)
		return nil, "", fmt.Errorf("mosquitto port: %w", err)
	}
	url := fmt.Sprintf("mqtt://%s:%s", host, port.Port())
	return container, url, nil
}

func startInfluxDB(ctx context.Context) (testcontainers.Container, string, error) {
	req := testcontainers.ContainerRequest{
		Image:        influxImage,
		ExposedPorts: []string{"8086/tcp"},
		Env: map[string]string{
			"DOCKER_INFLUXDB_INIT_MODE":        "setup",
			"DOCKER_INFLUXDB_INIT_USERNAME":    influxAdminUser,
			"DOCKER_INFLUXDB_INIT_PASSWORD":    influxAdminPass,
			"DOCKER_INFLUXDB_INIT_ORG":         influxOrganization,
			"DOCKER_INFLUXDB_INIT_BUCKET":      influxBucket,
			"DOCKER_INFLUXDB_INIT_ADMIN_TOKEN": influxSetupToken,
		},
		WaitingFor: wait.ForHTTP("/health").WithPort("8086/tcp").WithStartupTimeout(2 * time.Minute),
	}
	container, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: req,
		Started:          true,
	})
	if err != nil {
		return nil, "", fmt.Errorf("start InfluxDB: %w", err)
	}
	host, err := container.Host(ctx)
	if err != nil {
		_ = container.Terminate(ctx)
		return nil, "", fmt.Errorf("influx host: %w", err)
	}
	port, err := container.MappedPort(ctx, "8086")
	if err != nil {
		_ = container.Terminate(ctx)
		return nil, "", fmt.Errorf("influx port: %w", err)
	}
	url := fmt.Sprintf("http://%s:%s", host, port.Port())
	return container, url, nil
}

func startBackendStub() *httptest.Server {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(writer http.ResponseWriter, request *http.Request) {
		writer.WriteHeader(http.StatusOK)
	})
	return httptest.NewServer(mux)
}

func terminateContainers(ctx context.Context, containers []testcontainers.Container) error {
	if ctx == nil {
		ctx = context.Background()
	}
	var errs []error
	for _, c := range containers {
		if c == nil {
			continue
		}
		if err := c.Terminate(ctx); err != nil {
			errs = append(errs, err)
		}
	}
	return errors.Join(errs...)
}

func locateRepoRoot() (string, error) {
	_, currentFile, _, ok := runtime.Caller(0)
	if !ok {
		return "", errors.New("locateRepoRoot: unable to determine caller file path")
	}
	repoRoot := filepath.Clean(filepath.Join(filepath.Dir(currentFile), "..", "..", "..", ".."))
	if _, err := os.Stat(filepath.Join(repoRoot, "go.work")); err != nil {
		return "", fmt.Errorf("locateRepoRoot: go.work not found: %w", err)
	}
	return repoRoot, nil
}
