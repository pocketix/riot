package main

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/rabbitmq"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedConstants"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedUtils"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-message-processing-unit/src/processing"
	"log"
	"sync"
	"time"
)

var (
	rabbitMQClient                           rabbitmq.Client
	kpiDefinitionsBySDTypeDenotationMap      map[string][]sharedModel.KPIDefinition
	kpiDefinitionsBySDTypeDenotationMapMutex sync.Mutex
)

func checkKPIFulfilmentThenEnqueueResult(sdInstanceUID string, sdParameters any, kpiDefinition sharedModel.KPIDefinition) {
	kpiFulfillmentCheckResult := processing.CheckKPIFulfillment(kpiDefinition, &sdParameters)
	if kpiFulfillmentCheckResult.IsFailure() {
		log.Printf("Failed to check KPI fulfillment: %s\n", kpiFulfillmentCheckResult.GetError().Error())
		return
	}
	kpiFulfillmentCheckResultISCMessage := sharedModel.KPIFulfillmentCheckResultISCMessage{ // TODO: Consider employing the timestamp...
		SDInstanceUID:   sdInstanceUID,
		KPIDefinitionID: sharedUtils.NewOptionalFromPointer(kpiDefinition.ID).GetPayload(),
		Fulfilled:       kpiFulfillmentCheckResult.GetPayload(),
	}
	jsonSerializationResult := sharedUtils.SerializeToJSON(kpiFulfillmentCheckResultISCMessage)
	if jsonSerializationResult.IsFailure() {
		log.Println("Failed to serialize the object representing a KPI fulfillment check result into JSON")
		return
	}
	if err := rabbitMQClient.EnqueueJSONMessage(sharedConstants.KPIFulfillmentCheckResultsQueueName, jsonSerializationResult.GetPayload()); err != nil {
		log.Println("Failed to publish a KPI fulfillment check result message")
	}
}

func checkForKPIFulfilmentCheckRequests() {
	err := rabbitmq.ConsumeJSONMessages[sharedModel.KPIFulfillmentCheckRequestISCMessage](rabbitMQClient, sharedConstants.KPIFulfillmentCheckRequestsQueueName, func(messagePayload sharedModel.KPIFulfillmentCheckRequestISCMessage) error {
		kpiDefinitionsBySDTypeDenotationMapMutex.Lock()
		kpiDefinitions := kpiDefinitionsBySDTypeDenotationMap[messagePayload.SDTypeSpecification]
		kpiDefinitionsBySDTypeDenotationMapMutex.Unlock()
		sdInstanceUID := messagePayload.SDInstanceUID
		kpiDefinitions = sharedUtils.Filter(kpiDefinitions, func(kpiDefinition sharedModel.KPIDefinition) bool {
			return kpiDefinition.SDInstanceMode == sharedModel.ALL || sharedUtils.NewSetFromSlice(kpiDefinition.SelectedSDInstanceUIDs).Contains(sdInstanceUID)
		})
		var wg sync.WaitGroup
		wg.Add(len(kpiDefinitions))
		for _, kpiDefinition := range kpiDefinitions {
			go func(kpiDefinition sharedModel.KPIDefinition) { // TODO: Consider replacing 'unlimited' number of gorountines by worker pool
				defer wg.Done()
				checkKPIFulfilmentThenEnqueueResult(sdInstanceUID, messagePayload.Parameters, kpiDefinition)
			}(kpiDefinition)
		}
		wg.Wait()
		return nil
	})
	if err != nil {
		log.Printf("Consumption of messages from the '%s' queue has failed: %s\n", sharedConstants.KPIFulfillmentCheckRequestsQueueName, err.Error())
	}
}

func checkForKPIDefinitionsBySDTypeDenotationMapUpdates() {
	err := rabbitmq.ConsumeJSONMessages[sharedModel.KPIConfigurationUpdateISCMessage](rabbitMQClient, sharedConstants.KPIDefinitionsBySDTypeDenotationMapUpdates, func(messagePayload sharedModel.KPIConfigurationUpdateISCMessage) error {
		kpiDefinitionsBySDTypeDenotationMapMutex.Lock()
		kpiDefinitionsBySDTypeDenotationMap = messagePayload
		kpiDefinitionsBySDTypeDenotationMapMutex.Unlock()
		return nil
	})
	if err != nil {
		log.Printf("Consumption of messages from the '%s' queue has failed: %s\n", sharedConstants.KPIDefinitionsBySDTypeDenotationMapUpdates, err.Error())
	}
}

func main() {
	sharedUtils.TerminateOnError(sharedUtils.WaitForDSs(time.Minute, sharedUtils.NewPairOf("sfpdfsd-backend-core", 9090)), "Some dependencies of this application are inaccessible")
	rabbitMQClient = rabbitmq.NewClient()
	sharedUtils.StartLoggingProfilingInformationPeriodically(time.Minute)
	sharedUtils.WaitForAll(checkForKPIDefinitionsBySDTypeDenotationMapUpdates, checkForKPIFulfilmentCheckRequests)
	rabbitMQClient.Dispose()
}
