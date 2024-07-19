package main

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/rabbitmq"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedConstants"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"github.com/MichalBures-OG/bp-bures-RIoT-message-processing-unit/src/processing"
	"github.com/google/uuid"
	"log"
	"net/url"
	"os"
	"sync"
	"time"
)

var (
	kpiDefinitionsBySDTypeDenotationMap      map[string][]sharedModel.KPIDefinition
	kpiDefinitionsBySDTypeDenotationMapMutex sync.Mutex
	unitUUID                                 string
)

func checkForKPIFulfilmentCheckRequests() {
	rabbitMQClient := rabbitmq.NewClient()
	defer rabbitMQClient.Dispose()
	err := rabbitmq.ConsumeJSONMessages[sharedModel.KPIFulfillmentCheckRequestISCMessage](rabbitMQClient, sharedConstants.KPIFulfillmentCheckRequestsQueueName, func(messagePayload sharedModel.KPIFulfillmentCheckRequestISCMessage) error {
		kpiDefinitionsBySDTypeDenotationMapMutex.Lock()
		kpiDefinitions := kpiDefinitionsBySDTypeDenotationMap[messagePayload.SDTypeSpecification]
		kpiDefinitionsBySDTypeDenotationMapMutex.Unlock()
		sdInstanceUID := messagePayload.SDInstanceUID
		kpiDefinitions = sharedUtils.Filter(kpiDefinitions, func(kpiDefinition sharedModel.KPIDefinition) bool {
			selectedSDInstanceUIDSet := sharedUtils.NewSetFromSlice(kpiDefinition.SelectedSDInstanceUIDs)
			return kpiDefinition.SDInstanceMode == sharedModel.ALL || selectedSDInstanceUIDSet.Contains(sdInstanceUID)
		})
		if len(kpiDefinitions) == 0 {
			return nil
		}
		kpiFulfillmentCheckResults := sharedUtils.EmptySlice[sharedModel.KPIFulfillmentCheckResultISCMessage]()
		for _, kpiDefinition := range kpiDefinitions { // TODO: Consider replacing sequential processing by a worker pool
			kpiFulfillmentCheckResult := processing.CheckKPIFulfillment(kpiDefinition, &messagePayload.Parameters)
			if kpiFulfillmentCheckResult.IsFailure() {
				log.Printf("Failed to check KPI fulfillment: %s\n", kpiFulfillmentCheckResult.GetError().Error())
				continue
			}
			kpiFulfillmentCheckResults = append(kpiFulfillmentCheckResults, sharedModel.KPIFulfillmentCheckResultISCMessage{ // TODO: Consider employing the timestamp...
				SDInstanceUID:   sdInstanceUID,
				KPIDefinitionID: sharedUtils.NewOptionalFromPointer(kpiDefinition.ID).GetPayload(),
				Fulfilled:       kpiFulfillmentCheckResult.GetPayload(),
			})
		}
		jsonSerializationResult := sharedUtils.SerializeToJSON(kpiFulfillmentCheckResults)
		if jsonSerializationResult.IsFailure() {
			log.Printf("Failed to serialize the object representing a KPI fulfillment check result tuple into JSON: %s\n", jsonSerializationResult.GetError().Error())
			return nil
		}
		if err := rabbitMQClient.PublishJSONMessage(sharedUtils.NewEmptyOptional[string](), sharedUtils.NewOptionalOf(sharedConstants.KPIFulfillmentCheckResultsQueueName), jsonSerializationResult.GetPayload()); err != nil {
			log.Printf("Failed to publish a KPI fulfillment check result tuple message: %s\n", err.Error())
		}
		return nil
	})
	if err != nil {
		log.Printf("Consumption of messages from the '%s' queue has failed: %s\n", sharedConstants.KPIFulfillmentCheckRequestsQueueName, err.Error())
	}
}

func checkForKPIDefinitionsBySDTypeDenotationMapUpdates() {
	go func() {
		time.Sleep(time.Second)
		rabbitMQClient := rabbitmq.NewClient()
		defer rabbitMQClient.Dispose()
		if err := rabbitMQClient.PublishJSONMessage(sharedUtils.NewEmptyOptional[string](), sharedUtils.NewOptionalOf(sharedConstants.MessageProcessingUnitConnectionNotificationsQueueName), []byte("{}")); err != nil {
			log.Printf("Failed to publish the message processing unit connection notification message to the %s queue: %s\n", sharedConstants.MessageProcessingUnitConnectionNotificationsQueueName, err.Error())
		}
	}()
	rabbitMQClient := rabbitmq.NewClient()
	defer rabbitMQClient.Dispose()
	err := rabbitmq.ConsumeJSONMessagesFromFanoutExchange[sharedModel.KPIConfigurationUpdateISCMessage](rabbitMQClient, sharedConstants.BuiltInFanoutExchangeName, func(messagePayload sharedModel.KPIConfigurationUpdateISCMessage) error {
		log.Printf("KPI definitions by SD type denotation map update reached unit %s\n", unitUUID)
		kpiDefinitionsBySDTypeDenotationMapMutex.Lock()
		kpiDefinitionsBySDTypeDenotationMap = messagePayload
		kpiDefinitionsBySDTypeDenotationMapMutex.Unlock()
		return nil
	})
	if err != nil {
		log.Printf("Consumption of messages from the '%s' fanout exchange has failed: %s\n", sharedConstants.BuiltInFanoutExchangeName, err.Error())
	}
}

func main() {
	log.SetOutput(os.Stderr)
	log.Println("Waiting for dependencies...")
	rawBackendCoreURL := sharedUtils.GetEnvironmentVariableValue("BACKEND_CORE_URL").GetPayloadOrDefault("http://riot-backend-core:9090")
	parsedBackendCoreURL, err := url.Parse(rawBackendCoreURL)
	sharedUtils.TerminateOnError(err, fmt.Sprintf("Unable to parse the backend-core URL: %s", rawBackendCoreURL))
	sharedUtils.TerminateOnError(sharedUtils.WaitForDSs(time.Minute, sharedUtils.NewPairOf(parsedBackendCoreURL.Hostname(), parsedBackendCoreURL.Port())), "Some dependencies of this application are inaccessible")
	log.Println("Dependencies should be up and running...")
	unitUUID = uuid.New().String()
	sharedUtils.StartLoggingProfilingInformationPeriodically(time.Minute)
	sharedUtils.WaitForAll(checkForKPIDefinitionsBySDTypeDenotationMapUpdates, checkForKPIFulfilmentCheckRequests)
}
