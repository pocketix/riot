package main

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/api/graphql"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/isc"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"log"
	"time"
)

func waitForDependencies() {
	rabbitMQ := sharedUtils.NewPairOf("rabbitmq", 5672)
	postgreSQL := sharedUtils.NewPairOf("postgres", 5432)
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
	log.Println("Waiting for dependencies...")
	waitForDependencies()
	log.Println("Dependencies ready...")
	sharedUtils.StartLoggingProfilingInformationPeriodically(time.Minute)
	kickstartISC()
	graphql.SetupGraphQLServer()
}
