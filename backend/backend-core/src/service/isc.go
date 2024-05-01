package service

import (
	"errors"
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/types"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/constants"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/kpi"
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

func CheckForSDInstanceRegistrationRequests() {
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
		if (*db.GetRelationalDatabaseClientInstance()).PersistSDInstance(sdInstanceDTO).IsFailure() {
			return errors.New("couldn't persist the SD instance")
		}
		return nil
	})
	if err != nil {
		log.Printf("Consumption of messages from the '%s' queue has failed", constants.SDInstanceRegistrationRequestsQueueName)
	}
}

func CheckForKPIFulfillmentCheckResults() {
	err := rabbitmq.ConsumeJSONMessages(rabbitMQClient, constants.KPIFulfillmentCheckResultsQueueName, func(messagePayload cTypes.KPIFulfillmentCheckResultInfo) error {
		targetKPIDefinitionID := messagePayload.KPIDefinitionID
		targetSDInstanceUID := messagePayload.UID
		fulfilled := messagePayload.Fulfilled
		kpiFulfillmentCheckResultOptional := util.FindFirst((*db.GetRelationalDatabaseClientInstance()).LoadKPIFulFulfillmentCheckResults().GetPayload(), func(k types.KPIFulfillmentCheckResultDTO) bool {
			return k.KPIDefinition.ID.GetPayload() == targetKPIDefinitionID && k.SDInstance.UID == targetSDInstanceUID
		})
		if kpiFulfillmentCheckResultOptional.IsPresent() {
			kpiFulfillmentCheckResult := kpiFulfillmentCheckResultOptional.GetPayload()
			kpiFulfillmentCheckResult.Fulfilled = fulfilled
			if (*db.GetRelationalDatabaseClientInstance()).PersistKPIFulFulfillmentCheckResult(kpiFulfillmentCheckResult).IsFailure() {
				return fmt.Errorf("couldn't update KPI fulfillment check result with ID = %d", kpiFulfillmentCheckResult.ID.GetPayload())
			}
			return nil
		}
		// TODO: Searching for target KPI definition on service layer (suboptimal)
		kpiDefinitionsLoadResult := (*db.GetRelationalDatabaseClientInstance()).LoadKPIDefinitions()
		if kpiDefinitionsLoadResult.IsFailure() {
			return errors.New("couldn't load KPI definitions")
		}
		targetKPIDefinitionOptional := util.FindFirst(kpiDefinitionsLoadResult.GetPayload(), func(k kpi.DefinitionDTO) bool { return k.ID.GetPayload() == targetKPIDefinitionID })
		if targetKPIDefinitionOptional.IsEmpty() {
			return fmt.Errorf("couldn't load database record of KPI definition with ID = %d", targetKPIDefinitionID)
		}
		// TODO: Searching for target SD instance on service layer (suboptimal)
		sdInstancesLoadResult := (*db.GetRelationalDatabaseClientInstance()).LoadSDInstances()
		if sdInstancesLoadResult.IsFailure() {
			return errors.New("couldn't load SD instances")
		}
		targetSDInstanceOptional := util.FindFirst(sdInstancesLoadResult.GetPayload(), func(s types.SDInstanceDTO) bool { return s.UID == targetSDInstanceUID })
		if targetSDInstanceOptional.IsEmpty() {
			return fmt.Errorf("couldn't load database record of SD instance with UID = %d", targetSDInstanceUID)
		}
		kpiFulfillmentCheckResultDTO := types.KPIFulfillmentCheckResultDTO{
			ID:            util.NewEmptyOptional[uint32](),
			KPIDefinition: targetKPIDefinitionOptional.GetPayload(),
			SDInstance:    targetSDInstanceOptional.GetPayload(),
			Fulfilled:     fulfilled,
		}
		if (*db.GetRelationalDatabaseClientInstance()).PersistKPIFulFulfillmentCheckResult(kpiFulfillmentCheckResultDTO).IsFailure() {
			return errors.New("couldn't persist the KPI fulfillment check result")
		}
		return nil
	})
	if err != nil {
		log.Printf("Consumption of messages from the '%s' queue has failed", constants.KPIFulfillmentCheckResultsQueueName)
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
