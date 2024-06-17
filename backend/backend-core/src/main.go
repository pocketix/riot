package main

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/api/graphql"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/isc"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"log"
	"net/url"
	"os"
	"time"
)

func waitForDependencies() {
	rawRabbitMQURL := sharedUtils.GetEnvironmentVariableValue("RABBITMQ_URL").GetPayloadOrDefault("amqp://guest:guest@rabbitmq:5672")
	parsedRabbitMQURL, err := url.Parse(rawRabbitMQURL)
	sharedUtils.TerminateOnError(err, fmt.Sprintf("Unable to parse the RabbitMQ URL: %s", rawRabbitMQURL))
	rabbitMQ := sharedUtils.NewPairOf(parsedRabbitMQURL.Hostname(), parsedRabbitMQURL.Port())
	rawPostgresURL := sharedUtils.GetEnvironmentVariableValue("POSTGRES_URL").GetPayloadOrDefault("postgres://admin:password@postgres:5432/postgres-db")
	parsedPostgresURL, err := url.Parse(rawPostgresURL)
	sharedUtils.TerminateOnError(err, fmt.Sprintf("Unable to parse the Postgres URL: %s", rawPostgresURL))
	postgreSQL := sharedUtils.NewPairOf(parsedPostgresURL.Hostname(), parsedPostgresURL.Port())
	sharedUtils.TerminateOnError(sharedUtils.WaitForDSs(time.Minute, rabbitMQ, postgreSQL), "Some dependencies of this application are inaccessible")
}

func kickstartISC() {
	isc.SetupRabbitMQInfrastructureForISC()
	isc.EnqueueMessageRepresentingCurrentSDTypeConfiguration()
	isc.EnqueueMessageRepresentingCurrentSDInstanceConfiguration()
	go isc.ProcessIncomingMessageProcessingUnitConnectionNotifications()
	go isc.ProcessIncomingSDInstanceRegistrationRequests(&graphql.SDInstanceGraphQLSubscriptionChannel)
	go isc.ProcessIncomingKPIFulfillmentCheckResults(&graphql.KPIFulfillmentCheckResultGraphQLSubscriptionChannel)
}

func main() {
	log.SetOutput(os.Stderr)
	log.Println("Waiting for dependencies...")
	waitForDependencies()
	log.Println("Dependencies ready...")
	sharedUtils.StartLoggingProfilingInformationPeriodically(time.Minute)
	kickstartISC()
	graphql.SetupGraphQLServer()
}
