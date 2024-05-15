package main

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/api/graphql"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/isc"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
	"time"
)

func waitForDependencies() {
	rabbitMQ := util.NewPairOf("rabbitmq", 5672)
	postgreSQL := util.NewPairOf("postgres", 5432)
	util.TerminateOnError(util.WaitForDSs(time.Minute, rabbitMQ, postgreSQL), "Some dependencies of this application are inaccessible")
}

func setupISC() {
	isc.SetupRabbitMQInfrastructureForISC()
	isc.EnqueueMessagesRepresentingCurrentSystemConfiguration()
	go isc.ProcessIncomingSDInstanceRegistrationRequests(&graphql.SDInstanceChannel)
	go isc.ProcessIncomingKPIFulfillmentCheckResults(&graphql.KPIFulfillmentCheckResultChannel)
}

func main() {
	waitForDependencies()
	setupISC()
	graphql.SetupGraphQLServer()
}
