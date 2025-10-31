package pipeline

import (
	"context"
	"encoding/json"
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/require"

	"github.com/xjohnp00/jiap/backend/integration/internal/testinfra"
)

func TestPipeline_MQTTToTimeSeriesStore(t *testing.T) {
	t.Helper()

	if testing.Short() {
		t.Skip("skipping integration test in short mode")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	t.Log("Setting up integration infrastructure (Docker dependencies + helpers)")
	infra, err := testinfra.Start(ctx)
	require.NoError(t, err)
	t.Log("Infrastructure setup complete")

	defer func() {
		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 20*time.Second)
		defer shutdownCancel()
		require.NoError(t, infra.Close(shutdownCtx))
	}()

	t.Log("Declaring RabbitMQ queues via backend-core ISC setup")
	infra.SetupQueues()

	t.Log("Building service binaries")
	mqttBinary, err := infra.BuildMainPackage(ctx, "backend/mqtt-preprocessor")
	require.NoError(t, err)
	t.Logf("mqtt-preprocessor binary ready: %s", mqttBinary)

	timeSeriesBinary, err := infra.BuildMainPackage(ctx, "backend/time-series-store")
	require.NoError(t, err)
	t.Logf("time-series-store binary ready: %s", timeSeriesBinary)

	mqttService, err := infra.StartService(ctx, t, "riot-mqtt-preprocessor", mqttBinary, "Dependencies should be up and running...", infra.MQTTPReprocessorEnv())
	require.NoError(t, err)
	defer func() {
		stopCtx, stopCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer stopCancel()
		require.NoError(t, mqttService.Stop(stopCtx))
	}()

	t.Log("Awaiting mqtt-preprocessor readiness")
	require.NoError(t, mqttService.WaitReady(ctx))

	timeSeriesService, err := infra.StartService(ctx, t, "riot-time-series-store", timeSeriesBinary, "Time Series Store Ready", infra.TimeSeriesStoreEnv())
	require.NoError(t, err)
	defer func() {
		stopCtx, stopCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer stopCancel()
		require.NoError(t, timeSeriesService.Stop(stopCtx))
	}()

	t.Log("Awaiting time-series-store readiness")
	require.NoError(t, timeSeriesService.WaitReady(ctx))

	deviceUID := fmt.Sprintf("shelly30C6F787B4CCC-%d", time.Now().UnixNano())
	timestamp := float64(time.Now().Unix())

	payload := map[string]any{
		"ntf": map[string]any{
			"msgId": "integration-test-msg",
			"tst":   timestamp,
		},
		"data": map[string]any{
			"devs": []map[string]any{
				{
					"devType": "shelly1pro",
					"devUid":  deviceUID,
					"devAttrs": map[string]any{
						"firmware": "integration",
					},
					"devPars": map[string]any{
						"mac":                 "30C6F787B4CC",
						"relay_0_output":      false,
						"relay_0_temperature": 21.5,
					},
				},
			},
		},
		"topic":       fmt.Sprintf("IotLogimic/dev5/shelly/shelly1pro/%s/john/ntf", deviceUID),
		"topicPrefix": "IotLogimic",
		"appId":       "john",
		"dir":         "ntf",
		"connName":    "iTemp2",
	}

	payloadBytes, err := json.Marshal(payload)
	require.NoError(t, err)

	t.Logf("Publishing MQTT payload for device %s", deviceUID)
	require.NoError(t, infra.PublishMQTT(ctx, payloadBytes))

	t.Logf("Waiting for Influx data under measurement %s", deviceUID)
	var lastErr error
	require.Eventually(t, func() bool {
		hasData, err := infra.InfluxHasMeasurement(ctx, deviceUID)
		if err != nil {
			lastErr = err
			return false
		}
		return hasData
	}, 1*time.Minute, 2*time.Second, "expected time-series data not found for %s", deviceUID)
	require.NoError(t, lastErr)
	t.Log("Time-series data detected; pipeline flow verified")
}
