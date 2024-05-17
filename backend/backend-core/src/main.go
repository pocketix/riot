package main

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/api/graphql"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/isc"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedUtils"
	"time"
)

func waitForDependencies() {
	rabbitMQ := sharedUtils.NewPairOf("rabbitmq", 5672)
	postgreSQL := sharedUtils.NewPairOf("postgres", 5432)
	sharedUtils.TerminateOnError(sharedUtils.WaitForDSs(time.Minute, rabbitMQ, postgreSQL), "Some dependencies of this application are inaccessible")
}

func setupISC() {
	isc.SetupRabbitMQInfrastructureForISC()
	isc.EnqueueMessagesRepresentingCurrentSystemConfiguration()
	go isc.ProcessIncomingSDInstanceRegistrationRequests(&graphql.SDInstanceGraphQLSubscriptionChannel)
	go isc.ProcessIncomingKPIFulfillmentCheckResults(&graphql.KPIFulfillmentCheckResultGraphQLSubscriptionChannel)
}

func main() {
	waitForDependencies()
	setupISC()
	graphql.SetupGraphQLServer()
}
