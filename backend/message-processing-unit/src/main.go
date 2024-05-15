package main

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/kpi"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/rabbitmq"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedConstants"
	cTypes "github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/types"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
	"github.com/google/uuid"
	"log"
	"sync"
	"time"
)

var (
	dsInstanceID                             uuid.UUID
	rabbitMQClient                           rabbitmq.Client
	kpiDefinitionsBySDTypeDenotationMap      map[string][]kpi.DefinitionDTO
	kpiDefinitionsBySDTypeDenotationMapMutex sync.Mutex
)

func checkKPIFulfilmentThenEnqueueResult(sdUniqueIdentifier string, sdParameters any, kpiDefinition kpi.DefinitionDTO) {
	kpiFulfillmentCheckResult := cTypes.KPIFulfillmentCheckResultInfo{ // TODO: Consider employing the timestamp...
		UID:             sdUniqueIdentifier,
		KPIDefinitionID: kpiDefinition.ID.GetPayload(),
		Fulfilled:       kpi.CheckKPIFulfillment(kpiDefinition, &sdParameters),
	}
	jsonSerializationResult := util.SerializeToJSON(kpiFulfillmentCheckResult)
	if jsonSerializationResult.IsFailure() {
		log.Println("Failed to serialize the object representing a KPI fulfillment check result into JSON")
		return
	}
	if err := rabbitMQClient.EnqueueJSONMessage(sharedConstants.KPIFulfillmentCheckResultsQueueName, jsonSerializationResult.GetPayload()); err != nil {
		log.Println("Failed to publish a KPI fulfillment check result message")
	}
}

func checkForKPIFulfilmentCheckRequests() {
	err := rabbitmq.ConsumeJSONMessages[cTypes.RequestForKPIFulfillmentCheck](rabbitMQClient, sharedConstants.KPIFulfillmentCheckRequestsQueueName, func(messagePayload cTypes.RequestForKPIFulfillmentCheck) error {
		log.Printf("KPI fulfillment check request accepted by message processing unit with UUID = %s\n", dsInstanceID.String()) // TODO: Get rid of this line once it's unnecessary
		sdInfo := messagePayload.SD
		kpiDefinitionsBySDTypeDenotationMapMutex.Lock()
		kpiDefinitions := kpiDefinitionsBySDTypeDenotationMap[sdInfo.Type]
		kpiDefinitionsBySDTypeDenotationMapMutex.Unlock()
		var wg sync.WaitGroup
		wg.Add(len(kpiDefinitions))
		for _, kpiDefinition := range kpiDefinitions {
			go func(kpiDefinition kpi.DefinitionDTO) {
				defer wg.Done()
				checkKPIFulfilmentThenEnqueueResult(sdInfo.UID, messagePayload.Parameters, kpiDefinition)
			}(kpiDefinition)
		}
		wg.Wait()
		return nil
	})
	if err != nil {
		log.Printf("Consumption of messages from the '%s' queue has failed", sharedConstants.KPIFulfillmentCheckRequestsQueueName)
	}
}

func checkForKPIDefinitionsBySDTypeDenotationMapUpdates() {
	err := rabbitmq.ConsumeJSONMessages[map[string][]cTypes.KPIDefinitionTF](rabbitMQClient, sharedConstants.KPIDefinitionsBySDTypeDenotationMapUpdates, func(messagePayload map[string][]cTypes.KPIDefinitionTF) error {
		updatedKPIDefinitionsBySDTypeDenotationMap := make(map[string][]kpi.DefinitionDTO)
		for sdTypeDenotation, kpiDefinitionsTF := range messagePayload {
			kpiDefinitionDTOs, err := util.EMap(kpiDefinitionsTF, func(kpiDefinitionTF cTypes.KPIDefinitionTF) (kpi.DefinitionDTO, error) {
				return cTypes.KPIDefinitionTFToKPIDefinitionDTO(kpiDefinitionTF).Unwrap()
			})
			if err != nil {
				return err
			}
			updatedKPIDefinitionsBySDTypeDenotationMap[sdTypeDenotation] = kpiDefinitionDTOs
		}
		kpiDefinitionsBySDTypeDenotationMapMutex.Lock()
		kpiDefinitionsBySDTypeDenotationMap = updatedKPIDefinitionsBySDTypeDenotationMap
		kpiDefinitionsBySDTypeDenotationMapMutex.Unlock()
		return nil
	})
	if err != nil {
		log.Printf("Consumption of messages from the '%s' queue has failed", sharedConstants.KPIDefinitionsBySDTypeDenotationMapUpdates)
	}
}

func main() {
	dsInstanceID = uuid.New()
	util.TerminateOnError(util.WaitForDSs(time.Minute, util.NewPairOf("sfpdfsd-backend-core", 9090)), "Some dependencies of this application are inaccessible")
	rabbitMQClient = rabbitmq.NewClient()
	util.WaitForAll(checkForKPIDefinitionsBySDTypeDenotationMapUpdates, checkForKPIFulfilmentCheckRequests)
	rabbitMQClient.Dispose()
}
