package main

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/rabbitmq"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedConstants"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"github.com/MichalBures-OG/bp-bures-RIoT-message-processing-unit/src/processing"
	"github.com/google/uuid"
	"log"
	"sync"
	"time"
)

var (
	rabbitMQClient                           rabbitmq.Client
	kpiDefinitionsBySDTypeDenotationMap      map[string][]sharedModel.KPIDefinition
	kpiDefinitionsBySDTypeDenotationMapMutex sync.Mutex
	unitUUID                                 string
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
	if err := rabbitMQClient.PublishJSONMessage(sharedUtils.NewEmptyOptional[string](), sharedUtils.NewOptionalOf(sharedConstants.KPIFulfillmentCheckResultsQueueName), jsonSerializationResult.GetPayload()); err != nil {
		log.Println("Failed to publish a KPI fulfillment check result message")
	}
}

func checkForKPIFulfilmentCheckRequests() {
	err := rabbitmq.ConsumeJSONMessages[sharedModel.KPIFulfillmentCheckRequestISCMessage](rabbitMQClient, sharedConstants.KPIFulfillmentCheckRequestsQueueName, func(messagePayload sharedModel.KPIFulfillmentCheckRequestISCMessage) error {
		kpiDefinitionsBySDTypeDenotationMapMutex.Lock()
		kpiDefinitions := kpiDefinitionsBySDTypeDenotationMap[messagePayload.SDTypeSpecification]
		log.Printf("%d KPI definitions found for the SD type '%s'\n", len(kpiDefinitions), messagePayload.SDTypeSpecification)
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
	go func(rabbitMQClient rabbitmq.Client) {
		time.Sleep(time.Second)
		if err := rabbitMQClient.PublishJSONMessage(sharedUtils.NewEmptyOptional[string](), sharedUtils.NewOptionalOf(sharedConstants.MessageProcessingUnitConnectionNotificationsQueue), []byte("{}")); err != nil {
			log.Printf("Failed to publish the message processing unit connection notification message to the %s queue: %s\n", sharedConstants.MessageProcessingUnitConnectionNotificationsQueue, err.Error())
		}
	}(rabbitMQClient)
	err := rabbitmq.ConsumeJSONMessagesFromFanoutExchange[sharedModel.KPIConfigurationUpdateISCMessage](rabbitMQClient, sharedConstants.MainFanoutExchangeName, func(messagePayload sharedModel.KPIConfigurationUpdateISCMessage) error {
		log.Printf("KPI definitions by SD type denotation map update reached unit %s\n", unitUUID)
		kpiDefinitionsBySDTypeDenotationMapMutex.Lock()
		kpiDefinitionsBySDTypeDenotationMap = messagePayload
		kpiDefinitionsBySDTypeDenotationMapMutex.Unlock()
		return nil
	})
	if err != nil {
		log.Printf("Consumption of messages from the '%s' fanout exchange has failed: %s\n", sharedConstants.MainFanoutExchangeName, err.Error())
	}
}

func main() {
	log.Println("Waiting for backend-core...")
	sharedUtils.TerminateOnError(sharedUtils.WaitForDSs(time.Minute, sharedUtils.NewPairOf("riot-backend-core", 9090)), "Some dependencies of this application are inaccessible")
	log.Println("backend-core should be up and running...")
	unitUUID = uuid.New().String()
	rabbitMQClient = rabbitmq.NewClient()
	sharedUtils.StartLoggingProfilingInformationPeriodically(time.Minute)
	sharedUtils.WaitForAll(checkForKPIDefinitionsBySDTypeDenotationMapUpdates, checkForKPIFulfilmentCheckRequests)
	rabbitMQClient.Dispose()
}
