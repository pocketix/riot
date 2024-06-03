package main

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/api/graphql"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/isc"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedUtils"
	"log"
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
	// Making sure that instances of 'Message processing units' are working with up-to-date KPI definition per SD type mapping...
	// TODO: Consider coming up with a cleaner, more conceptually sound solution...
	go func() {
		ticker := time.NewTicker(3 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				isc.EnqueueMessageRepresentingCurrentKPIDefinitionConfiguration()
			}
		}
	}()
	go isc.ProcessIncomingSDInstanceRegistrationRequests(&graphql.SDInstanceGraphQLSubscriptionChannel)
	go isc.ProcessIncomingKPIFulfillmentCheckResults(&graphql.KPIFulfillmentCheckResultGraphQLSubscriptionChannel)
}

func main() {
	log.Println("Waiting for dependencies...")
	waitForDependencies()
	log.Println("Dependencies ready...")
	sharedUtils.StartLoggingProfilingInformationPeriodically(time.Minute)
	setupISC()
	graphql.SetupGraphQLServer()
}
