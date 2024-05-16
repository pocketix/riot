package isc

import (
	"errors"
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/dbClient"
	types2 "github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/modelMapping/dll2gql"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/rabbitmq"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedConstants"
	cTypes "github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/types"
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
	consumeSDInstanceRegistrationRequestJSONMessages(func(sdInstanceRegistrationRequest cTypes.RequestForSDInstanceRegistration) error {
		sd := sdInstanceRegistrationRequest.SD
		uid := sd.UID
		sdInstanceExistenceCheckResult := dbClient.GetRelationalDatabaseClientInstance().DoesSDInstanceExist(uid)
		if sdInstanceExistenceCheckResult.IsFailure() {
			return errors.New(fmt.Sprintf("couldn't check the existence of SD instance with UID: '%s'", uid))
		}
		if sdInstanceExistenceCheckResult.GetPayload() {
			return nil
		}
		sdTypeDenotation := sd.Type
		sdTypeLoadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDTypeBasedOnDenotation(sdTypeDenotation)
		if sdTypeLoadResult.IsFailure() {
			return errors.New(fmt.Sprintf("couldn't load database record of the '%s' SD type", sdTypeDenotation))
		}
		sdInstanceDTO := types2.SDInstance{
			UID:             uid,
			ConfirmedByUser: false,
			UserIdentifier:  uid,
			SDType:          sdTypeLoadResult.GetPayload(),
		}
		sdInstancePersistResult := dbClient.GetRelationalDatabaseClientInstance().PersistSDInstance(sdInstanceDTO)
		if sdInstancePersistResult.IsFailure() {
			return errors.New("couldn't persist the SD instance")
		}
		sdInstanceDTO.ID = util.NewOptionalOf(sdInstancePersistResult.GetPayload())
		*sdInstanceChannel <- dll2gql.ToGraphQLModelSDInstance(sdInstanceDTO)
		return nil
	})
}

func ProcessIncomingKPIFulfillmentCheckResults(kpiFulfillmentCheckResultChannel *chan graphQLModel.KPIFulfillmentCheckResult) {
	consumeKPIFulfillmentCheckResultJSONMessages(func(kpiFulfillmentCheckResult cTypes.KPIFulfillmentCheckResultInfo) error {
		targetKPIDefinitionID := kpiFulfillmentCheckResult.KPIDefinitionID
		targetSDInstanceUID := kpiFulfillmentCheckResult.UID
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
		newKPIFulfillmentCheckResult := types2.KPIFulfillmentCheckResult{
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
		sdTypeDenotations := util.Map[types2.SDType, string](sdTypesLoadResult.GetPayload(), func(sdTypeDTO types2.SDType) string {
			return sdTypeDTO.Denotation
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
		sdInstancesInfo := util.Map[types2.SDInstance, cTypes.SDInstanceInfo](sdInstancesLoadResult.GetPayload(), func(sdInstanceDTO types2.SDInstance) cTypes.SDInstanceInfo {
			return cTypes.SDInstanceInfo{
				UID:             sdInstanceDTO.UID,
				ConfirmedByUser: sdInstanceDTO.ConfirmedByUser,
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
		kpiDefinitionsBySDTypeDenotationMapTF := make(map[string][]cTypes.KPIDefinitionTF)
		kpiDefinitionDTOs := kpiDefinitionsLoadResult.GetPayload()
		for _, kpiDefinitionDTO := range kpiDefinitionDTOs {
			sdTypeSpecification := kpiDefinitionDTO.SDTypeSpecification
			if _, exists := kpiDefinitionsBySDTypeDenotationMapTF[sdTypeSpecification]; !exists {
				kpiDefinitionsBySDTypeDenotationMapTF[sdTypeSpecification] = make([]cTypes.KPIDefinitionTF, 0)
			}
			kpiDefinitionsBySDTypeDenotationMapTF[sdTypeSpecification] = append(kpiDefinitionsBySDTypeDenotationMapTF[sdTypeSpecification], cTypes.KPIDefinitionDTOToKPIDefinitionTF(kpiDefinitionDTO))
		}
		kpiDefinitionsBySDTypeDenotationMapTFJSONSerializationResult := util.SerializeToJSON(kpiDefinitionsBySDTypeDenotationMapTF)
		if kpiDefinitionsBySDTypeDenotationMapTFJSONSerializationResult.IsFailure() {
			return kpiDefinitionsBySDTypeDenotationMapTFJSONSerializationResult.GetError()
		}
		return getRabbitMQClient().EnqueueJSONMessage(sharedConstants.KPIDefinitionsBySDTypeDenotationMapUpdates, kpiDefinitionsBySDTypeDenotationMapTFJSONSerializationResult.GetPayload())
	}(), "[ISC] Failed to enqueue RabbitMQ messages representing current KPI definition configuration")
}

func EnqueueMessagesRepresentingCurrentSystemConfiguration() {
	EnqueueMessageRepresentingCurrentSDTypeConfiguration()
	EnqueueMessageRepresentingCurrentSDInstanceConfiguration()
	EnqueueMessageRepresentingCurrentKPIDefinitionConfiguration()
}
