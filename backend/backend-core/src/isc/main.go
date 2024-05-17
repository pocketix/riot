package isc

import (
	"errors"
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/modelMapping/dll2gql"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/rabbitmq"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedConstants"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
	"sync"
)

var (
	rabbitMQClient rabbitmq.Client
	once           sync.Once
)

func getRabbitMQClient() rabbitmq.Client {
	once.Do(func() {
		rabbitMQClient = rabbitmq.NewClient()
	})
	return rabbitMQClient
}

func ProcessIncomingSDInstanceRegistrationRequests(sdInstanceChannel *chan graphQLModel.SDInstance) {
	consumeSDInstanceRegistrationRequestJSONMessages(func(sdInstanceRegistrationRequest sharedModel.SDInstanceRegistrationRequestISCMessage) error {
		sdInstanceUID := sdInstanceRegistrationRequest.SDInstanceUID
		sdInstanceExistenceCheckResult := dbClient.GetRelationalDatabaseClientInstance().DoesSDInstanceExist(sdInstanceUID)
		if sdInstanceExistenceCheckResult.IsFailure() {
			return errors.New(fmt.Sprintf("couldn't check the existence of SD instance with UID: '%s'", sdInstanceUID))
		}
		if sdInstanceExistenceCheckResult.GetPayload() {
			return nil
		}
		sdTypeDenotation := sdInstanceRegistrationRequest.SDTypeSpecification
		sdTypeLoadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDTypeBasedOnDenotation(sdTypeDenotation)
		if sdTypeLoadResult.IsFailure() {
			return errors.New(fmt.Sprintf("couldn't load database record of the '%s' SD type", sdTypeDenotation))
		}
		sdInstance := dllModel.SDInstance{
			UID:             sdInstanceUID,
			ConfirmedByUser: false,
			UserIdentifier:  sdInstanceUID,
			SDType:          sdTypeLoadResult.GetPayload(),
		}
		sdInstancePersistResult := dbClient.GetRelationalDatabaseClientInstance().PersistSDInstance(sdInstance)
		if sdInstancePersistResult.IsFailure() {
			return errors.New("couldn't persist the SD instance")
		}
		sdInstance.ID = util.NewOptionalOf(sdInstancePersistResult.GetPayload())
		*sdInstanceChannel <- dll2gql.ToGraphQLModelSDInstance(sdInstance)
		return nil
	})
}

func ProcessIncomingKPIFulfillmentCheckResults(kpiFulfillmentCheckResultChannel *chan graphQLModel.KPIFulfillmentCheckResult) {
	consumeKPIFulfillmentCheckResultJSONMessages(func(kpiFulfillmentCheckResult sharedModel.KPIFulfillmentCheckResultISCMessage) error {
		targetKPIDefinitionID := kpiFulfillmentCheckResult.KPIDefinitionID
		targetSDInstanceUID := kpiFulfillmentCheckResult.SDInstanceUID
		fulfilled := kpiFulfillmentCheckResult.Fulfilled
		targetSDInstanceLoadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDInstanceBasedOnUID(targetSDInstanceUID)
		if targetSDInstanceLoadResult.IsFailure() {
			return fmt.Errorf("couldn't load data from database (SD instance with UID = %s): %w", targetSDInstanceUID, targetSDInstanceLoadResult.GetError())
		}
		targetSDInstanceOptional := targetSDInstanceLoadResult.GetPayload()
		if targetSDInstanceOptional.IsEmpty() {
			return fmt.Errorf("there is no record of SD instance with UID = %s in the database", targetSDInstanceUID)
		}
		targetSDInstanceID := targetSDInstanceOptional.GetPayload().ID.GetPayload()
		existingKPIFulfillmentCheckResultLoadResult := dbClient.GetRelationalDatabaseClientInstance().LoadKPIFulFulfillmentCheckResult(targetKPIDefinitionID, targetSDInstanceID)
		if existingKPIFulfillmentCheckResultLoadResult.IsFailure() {
			err := existingKPIFulfillmentCheckResultLoadResult.GetError()
			return fmt.Errorf("couldn't load data from database (KPI fulfillment check result with KPI definition ID = %d and SD instance ID = %d): %w", targetKPIDefinitionID, targetSDInstanceID, err)
		}
		existingKPIFulfillmentCheckResultOptional := existingKPIFulfillmentCheckResultLoadResult.GetPayload()
		if existingKPIFulfillmentCheckResultOptional.IsPresent() {
			existingKPIFulfillmentCheckResult := existingKPIFulfillmentCheckResultOptional.GetPayload()
			existingKPIFulfillmentCheckResult.Fulfilled = fulfilled
			if err := dbClient.GetRelationalDatabaseClientInstance().PersistKPIFulFulfillmentCheckResult(existingKPIFulfillmentCheckResult); err != nil {
				return fmt.Errorf("couldn't update KPI fulfillment check result with KPI definition ID = %d and SD instance ID = %d: %w", targetKPIDefinitionID, targetSDInstanceID, err)
			}
			*kpiFulfillmentCheckResultChannel <- dll2gql.ToGraphQLModelKPIFulfillmentCheckResult(existingKPIFulfillmentCheckResult)
			return nil
		}
		newKPIFulfillmentCheckResult := dllModel.KPIFulfillmentCheckResult{
			KPIDefinitionID: targetKPIDefinitionID,
			SDInstanceID:    targetSDInstanceID,
			Fulfilled:       fulfilled,
		}
		if err := dbClient.GetRelationalDatabaseClientInstance().PersistKPIFulFulfillmentCheckResult(newKPIFulfillmentCheckResult); err != nil {
			return fmt.Errorf("couldn't persist KPI fulfillment check result with KPI definition ID = %d and SD instance ID = %d: %w", targetKPIDefinitionID, targetSDInstanceID, err)
		}
		*kpiFulfillmentCheckResultChannel <- dll2gql.ToGraphQLModelKPIFulfillmentCheckResult(newKPIFulfillmentCheckResult)
		return nil
	})
}

func EnqueueMessageRepresentingCurrentSDTypeConfiguration() {
	util.TerminateOnError(func() error {
		sdTypesLoadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDTypes()
		if sdTypesLoadResult.IsFailure() {
			return sdTypesLoadResult.GetError()
		}
		sdTypeDenotations := util.Map[dllModel.SDType, string](sdTypesLoadResult.GetPayload(), func(sdType dllModel.SDType) string {
			return sdType.Denotation
		})
		sdTypeDenotationsJSONSerializationResult := util.SerializeToJSON(sdTypeDenotations)
		if sdTypeDenotationsJSONSerializationResult.IsFailure() {
			return sdTypeDenotationsJSONSerializationResult.GetError()
		}
		return getRabbitMQClient().EnqueueJSONMessage(sharedConstants.SetOfSDTypesUpdatesQueueName, sdTypeDenotationsJSONSerializationResult.GetPayload())
	}(), "[ISC] Failed to enqueue RabbitMQ messages representing current SD type configuration")
}

func EnqueueMessageRepresentingCurrentSDInstanceConfiguration() {
	util.TerminateOnError(func() error {
		sdInstancesLoadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDInstances()
		if sdInstancesLoadResult.IsFailure() {
			return sdInstancesLoadResult.GetError()
		}
		sdInstancesInfo := util.Map[dllModel.SDInstance, sharedModel.SDInstanceInfo](sdInstancesLoadResult.GetPayload(), func(sdInstance dllModel.SDInstance) sharedModel.SDInstanceInfo {
			return sharedModel.SDInstanceInfo{
				SDInstanceUID:   sdInstance.UID,
				ConfirmedByUser: sdInstance.ConfirmedByUser,
			}
		})
		sdInstancesInfoJSONSerializationResult := util.SerializeToJSON(sdInstancesInfo)
		if sdInstancesInfoJSONSerializationResult.IsFailure() {
			return sdInstancesInfoJSONSerializationResult.GetError()
		}
		return getRabbitMQClient().EnqueueJSONMessage(sharedConstants.SetOfSDInstancesUpdatesQueueName, sdInstancesInfoJSONSerializationResult.GetPayload())
	}(), "[ISC] Failed to enqueue RabbitMQ messages representing current SD instance configuration")
}

func EnqueueMessageRepresentingCurrentKPIDefinitionConfiguration() {
	util.TerminateOnError(func() error {
		kpiDefinitionsLoadResult := dbClient.GetRelationalDatabaseClientInstance().LoadKPIDefinitions()
		if kpiDefinitionsLoadResult.IsFailure() {
			return kpiDefinitionsLoadResult.GetError()
		}
		kpiDefinitions := kpiDefinitionsLoadResult.GetPayload()
		kpiDefinitionsBySDTypeDenotationMap := make(sharedModel.KPIConfigurationUpdateISCMessage)
		for _, kpiDefinition := range kpiDefinitions {
			sdTypeSpecification := kpiDefinition.SDTypeSpecification
			if _, exists := kpiDefinitionsBySDTypeDenotationMap[sdTypeSpecification]; !exists {
				kpiDefinitionsBySDTypeDenotationMap[sdTypeSpecification] = make([]sharedModel.KPIDefinition, 0)
			}
			kpiDefinitionsBySDTypeDenotationMap[sdTypeSpecification] = append(kpiDefinitionsBySDTypeDenotationMap[sdTypeSpecification], kpiDefinition)
		}
		jsonSerializationResult := util.SerializeToJSON(kpiDefinitionsBySDTypeDenotationMap)
		if jsonSerializationResult.IsFailure() {
			return jsonSerializationResult.GetError()
		}
		return getRabbitMQClient().EnqueueJSONMessage(sharedConstants.KPIDefinitionsBySDTypeDenotationMapUpdates, jsonSerializationResult.GetPayload())
	}(), "[ISC] Failed to enqueue RabbitMQ messages representing current KPI definition configuration")
}

func EnqueueMessagesRepresentingCurrentSystemConfiguration() {
	EnqueueMessageRepresentingCurrentSDTypeConfiguration()
	EnqueueMessageRepresentingCurrentSDInstanceConfiguration()
	EnqueueMessageRepresentingCurrentKPIDefinitionConfiguration()
}
