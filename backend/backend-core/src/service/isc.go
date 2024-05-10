package service

import (
	"errors"
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/api/graphql/model"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/mapping/dto2api"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/types"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/constants"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/rabbitmq"
	cTypes "github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/types"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
	"log"
)

var rabbitMQClient rabbitmq.Client

func SetupRabbitMQClient() {
	client := rabbitmq.NewClient()
	rabbitMQClient = client
}

func CheckForSDInstanceRegistrationRequests(sdInstanceChannel *chan *model.SDInstance) {
	err := rabbitmq.ConsumeJSONMessages(rabbitMQClient, constants.SDInstanceRegistrationRequestsQueueName, func(messagePayload cTypes.RequestForSDInstanceRegistration) error {
		sd := messagePayload.SD
		uid := sd.UID
		sdInstanceExistenceCheckResult := (*db.GetRelationalDatabaseClientInstance()).DoesSDInstanceExist(uid)
		if sdInstanceExistenceCheckResult.IsFailure() {
			return errors.New(fmt.Sprintf("couldn't check the existence of SD instance with UID: '%s'", uid))
		}
		if sdInstanceExistenceCheckResult.GetPayload() {
			log.Println(fmt.Sprintf("SD instance with UID: '%s' already exists", uid))
			return nil
		}
		sdTypeDenotation := sd.Type
		sdTypeLoadResult := (*db.GetRelationalDatabaseClientInstance()).LoadSDTypeBasedOnDenotation(sdTypeDenotation)
		if sdTypeLoadResult.IsFailure() {
			return errors.New(fmt.Sprintf("couldn't load database record of the '%s' SD type", sdTypeDenotation))
		}
		sdInstanceDTO := types.SDInstanceDTO{
			UID:             uid,
			ConfirmedByUser: false,
			UserIdentifier:  uid,
			SDType:          sdTypeLoadResult.GetPayload(),
		}
		sdInstancePersistResult := (*db.GetRelationalDatabaseClientInstance()).PersistSDInstance(sdInstanceDTO)
		if sdInstancePersistResult.IsFailure() {
			return errors.New("couldn't persist the SD instance")
		}
		sdInstanceDTO.ID = util.NewOptionalOf(sdInstancePersistResult.GetPayload())
		*sdInstanceChannel <- dto2api.SDInstanceDTOToSDInstance(sdInstanceDTO)
		return nil
	})
	if err != nil {
		log.Printf("Consumption of messages from the '%s' queue has failed: %s", constants.SDInstanceRegistrationRequestsQueueName, err.Error())
	}
}

func CheckForKPIFulfillmentCheckResults() {
	err := rabbitmq.ConsumeJSONMessages(rabbitMQClient, constants.KPIFulfillmentCheckResultsQueueName, func(messagePayload cTypes.KPIFulfillmentCheckResultInfo) error {
		targetKPIDefinitionID := messagePayload.KPIDefinitionID
		targetSDInstanceUID := messagePayload.UID
		fulfilled := messagePayload.Fulfilled
		targetSDInstanceLoadResult := (*db.GetRelationalDatabaseClientInstance()).LoadSDInstanceBasedOnUID(targetSDInstanceUID)
		if targetSDInstanceLoadResult.IsFailure() {
			return fmt.Errorf("couldn't load data from database (SD instance with UID = %s): %w", targetSDInstanceUID, targetSDInstanceLoadResult.GetError())
		}
		targetSDInstanceOptional := targetSDInstanceLoadResult.GetPayload()
		if targetSDInstanceOptional.IsEmpty() {
			return fmt.Errorf("there is no record of SD instance with UID = %s in the database", targetSDInstanceUID)
		}
		targetSDInstanceID := targetSDInstanceOptional.GetPayload().ID.GetPayload()
		existingKPIFulfillmentCheckResultLoadResult := (*db.GetRelationalDatabaseClientInstance()).LoadKPIFulFulfillmentCheckResult(targetKPIDefinitionID, targetSDInstanceID)
		if existingKPIFulfillmentCheckResultLoadResult.IsFailure() {
			err := existingKPIFulfillmentCheckResultLoadResult.GetError()
			return fmt.Errorf("couldn't load data from database (KPI fulfillment check result with KPI definition ID = %d and SD instance ID = %d): %w", targetKPIDefinitionID, targetSDInstanceID, err)
		}
		existingKPIFulfillmentCheckResultOptional := existingKPIFulfillmentCheckResultLoadResult.GetPayload()
		if existingKPIFulfillmentCheckResultOptional.IsPresent() {
			existingKPIFulfillmentCheckResult := existingKPIFulfillmentCheckResultOptional.GetPayload()
			existingKPIFulfillmentCheckResult.Fulfilled = fulfilled
			if err := (*db.GetRelationalDatabaseClientInstance()).PersistKPIFulFulfillmentCheckResult(existingKPIFulfillmentCheckResult); err != nil {
				return fmt.Errorf("couldn't update KPI fulfillment check result with KPI definition ID = %d and SD instance ID = %d: %w", targetKPIDefinitionID, targetSDInstanceID, err)
			}
			return nil
		}
		newKPIFulfillmentCheckResult := types.KPIFulfillmentCheckResultDTO{
			KPIDefinitionID: targetKPIDefinitionID,
			SDInstanceID:    targetSDInstanceID,
			Fulfilled:       fulfilled,
		}
		if err := (*db.GetRelationalDatabaseClientInstance()).PersistKPIFulFulfillmentCheckResult(newKPIFulfillmentCheckResult); err != nil {
			return fmt.Errorf("couldn't persist KPI fulfillment check result with KPI definition ID = %d and SD instance ID = %d: %w", targetKPIDefinitionID, targetSDInstanceID, err)
		}
		return nil
	})
	if err != nil {
		log.Printf("Consumption of messages from the '%s' queue has failed: %s", constants.KPIFulfillmentCheckResultsQueueName, err.Error())
	}
}

func EnqueueMessageRepresentingCurrentSDTypes() error {
	sdTypesLoadResult := (*db.GetRelationalDatabaseClientInstance()).LoadSDTypes()
	if sdTypesLoadResult.IsFailure() {
		return sdTypesLoadResult.GetError()
	}
	sdTypeDenotations := util.Map[types.SDTypeDTO, string](sdTypesLoadResult.GetPayload(), func(sdTypeDTO types.SDTypeDTO) string {
		return sdTypeDTO.Denotation
	})
	sdTypeDenotationsJSONSerializationResult := util.SerializeToJSON(sdTypeDenotations)
	if sdTypeDenotationsJSONSerializationResult.IsFailure() {
		return sdTypeDenotationsJSONSerializationResult.GetError()
	}
	return rabbitMQClient.EnqueueJSONMessage(constants.SetOfSDTypesUpdatesQueueName, sdTypeDenotationsJSONSerializationResult.GetPayload())
}

func EnqueueMessageRepresentingCurrentSDInstances() error {
	sdInstancesLoadResult := (*db.GetRelationalDatabaseClientInstance()).LoadSDInstances()
	if sdInstancesLoadResult.IsFailure() {
		return sdInstancesLoadResult.GetError()
	}
	sdInstancesInfo := util.Map[types.SDInstanceDTO, cTypes.SDInstanceInfo](sdInstancesLoadResult.GetPayload(), func(sdInstanceDTO types.SDInstanceDTO) cTypes.SDInstanceInfo {
		return cTypes.SDInstanceInfo{
			UID:             sdInstanceDTO.UID,
			ConfirmedByUser: sdInstanceDTO.ConfirmedByUser,
		}
	})
	sdInstancesInfoJSONSerializationResult := util.SerializeToJSON(sdInstancesInfo)
	if sdInstancesInfoJSONSerializationResult.IsFailure() {
		return sdInstancesInfoJSONSerializationResult.GetError()
	}
	return rabbitMQClient.EnqueueJSONMessage(constants.SetOfSDInstancesUpdatesQueueName, sdInstancesInfoJSONSerializationResult.GetPayload())
}

func EnqueueMessageRepresentingCurrentKPIDefinitions() error {
	kpiDefinitionsLoadResult := (*db.GetRelationalDatabaseClientInstance()).LoadKPIDefinitions()
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
	return rabbitMQClient.EnqueueJSONMessage(constants.KPIDefinitionsBySDTypeDenotationMapUpdates, kpiDefinitionsBySDTypeDenotationMapTFJSONSerializationResult.GetPayload())
}

func EnqueueMessagesRepresentingCurrentConfiguration() error {
	if err := EnqueueMessageRepresentingCurrentSDTypes(); err != nil {
		return err
	}
	if err := EnqueueMessageRepresentingCurrentSDInstances(); err != nil {
		return err
	}
	if err := EnqueueMessageRepresentingCurrentKPIDefinitions(); err != nil {
		return err
	}
	return nil
}
