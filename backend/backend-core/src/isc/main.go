package isc

import (
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/modelMapping/dll2gql"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/rabbitmq"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedConstants"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

var ExecuteVPLProgramFunc func(dllModel.VPLProgram) sharedUtils.Result[graphQLModel.VPLProgramExecutionResult]

func ProcessIncomingMessageProcessingUnitConnectionNotifications() {
	rabbitMQClient := rabbitmq.NewClient()
	defer rabbitMQClient.Dispose()
	consumeMessageProcessingUnitConnectionNotificationJSONMessages(func(_ sharedModel.MessageProcessingUnitConnectionNotification) error {
		EnqueueMessageRepresentingCurrentKPIDefinitionConfiguration(rabbitMQClient)
		return nil
	}, rabbitMQClient)
}

func ProcessIncomingSDInstanceRegistrationRequests(sdInstanceGraphQLSubscriptionChannel *chan graphQLModel.SDInstance) {
	rabbitMQClient := rabbitmq.NewClient()
	defer rabbitMQClient.Dispose()
	consumeSDInstanceRegistrationRequestJSONMessages(func(sdInstanceRegistrationRequestISCMessage sharedModel.SDInstanceRegistrationRequestISCMessage) error {
		newSDInstanceUID := sdInstanceRegistrationRequestISCMessage.SDInstanceUID
		newSDInstanceSDTypeSpecification := sdInstanceRegistrationRequestISCMessage.SDTypeSpecification
		newSDInstancePersistResult := dbClient.GetRelationalDatabaseClientInstance().PersistNewSDInstance(newSDInstanceUID, newSDInstanceSDTypeSpecification)
		if newSDInstancePersistResult.IsSuccess() {
			select {
			case *sdInstanceGraphQLSubscriptionChannel <- dll2gql.ToGraphQLModelSDInstance(newSDInstancePersistResult.GetPayload()):
			default:
			}
		} else if newSDInstancePersistError := newSDInstancePersistResult.GetError(); !errors.Is(newSDInstancePersistError, dbClient.ErrOperationWouldLeadToForeignKeyIntegrityBreach) {
			return fmt.Errorf("failed to persist a new SD instance with UID = %s and SD type specification = %s: %w", newSDInstanceUID, newSDInstanceSDTypeSpecification, newSDInstancePersistError)
		}
		return nil
	}, rabbitMQClient)
}

func ProcessIncomingKPIFulfillmentCheckResults(kpiFulfillmentCheckResultGraphQLSubscriptionChannel *chan graphQLModel.KPIFulfillmentCheckResultTuple) {
	rabbitMQClient := rabbitmq.NewClient()
	defer rabbitMQClient.Dispose()
	consumeKPIFulfillmentCheckResultJSONMessages(func(kpiFulfillmentCheckResultTuple sharedModel.KPIFulfillmentCheckResultTupleISCMessage) error {
		if len(kpiFulfillmentCheckResultTuple) == 0 {
			log.Printf("Warning: Got an enpty tuple of KPI fulfillment check results... that shouldn't happen...")
			return nil
		}
		sdInstanceUID := kpiFulfillmentCheckResultTuple[0].SDInstanceUID
		kpiDefinitionIDs := make([]uint32, 0)
		fulfillmentStatuses := make([]bool, 0)
		for _, kpiFulfillmentCheckResult := range kpiFulfillmentCheckResultTuple {
			kpiDefinitionIDs = append(kpiDefinitionIDs, kpiFulfillmentCheckResult.KPIDefinitionID)
			fulfillmentStatuses = append(fulfillmentStatuses, kpiFulfillmentCheckResult.Fulfilled)
		}
		kpiFulfillmentCheckResultTuplePersistResult := dbClient.GetRelationalDatabaseClientInstance().PersistKPIFulFulfillmentCheckResultTuple(sdInstanceUID, kpiDefinitionIDs, fulfillmentStatuses)
		if kpiFulfillmentCheckResultTuplePersistResult.IsSuccess() {
			gqlKPIFulfillmentCheckResultTuple := graphQLModel.KPIFulfillmentCheckResultTuple{
				KpiFulfillmentCheckResults: sharedUtils.Map(kpiFulfillmentCheckResultTuplePersistResult.GetPayload(), dll2gql.ToGraphQLModelKPIFulfillmentCheckResult),
			}
			select {
			case *kpiFulfillmentCheckResultGraphQLSubscriptionChannel <- gqlKPIFulfillmentCheckResultTuple:
			default:
			}
		} else if kpiFulfillmentCheckResultTuplePersistError := kpiFulfillmentCheckResultTuplePersistResult.GetError(); !errors.Is(kpiFulfillmentCheckResultTuplePersistError, dbClient.ErrOperationWouldLeadToForeignKeyIntegrityBreach) {
			return fmt.Errorf("failed to persist KPI fulfillment check result tuple: %w", kpiFulfillmentCheckResultTuplePersistError)
		}
		return nil
	}, rabbitMQClient)
}

func ProcessIncomingSDParameterSnapshotUpdates(parameterSnapshotUpdateSubscriptionChannel *chan graphQLModel.SDParameterSnapshot) {
	rabbitMQClient := rabbitmq.NewClient()
	defer rabbitMQClient.Dispose()
	consumeParameterSnapshotUpdateJSONMessages(func(parameterSnapshotInfoMessage sharedModel.SDParameterSnapshotInfoMessage) error {
		SDInstance := dbClient.GetRelationalDatabaseClientInstance().LoadSDInstanceBasedOnUID(parameterSnapshotInfoMessage.SDInstanceUID)
		SDType := dbClient.GetRelationalDatabaseClientInstance().LoadSDTypeBasedOnDenotation(parameterSnapshotInfoMessage.SDType)

		if SDInstance.IsFailure() || SDType.IsFailure() ||
			SDInstance.GetPayload().IsEmpty() || SDInstance.GetPayload().GetPayload().ID.IsEmpty() ||
			SDType.GetPayload().ID.IsEmpty() {
			log.Printf("Unprocessable entity %s %s\n", parameterSnapshotInfoMessage.SDInstanceUID, parameterSnapshotInfoMessage.SDType)
		}

		SDInstanceID := SDInstance.GetPayload().GetPayload().ID.GetPayload()

		log.Printf("Info message: %+v\n", parameterSnapshotInfoMessage)
		for _, snapshot := range parameterSnapshotInfoMessage.SDParameterSnapshots {
			log.Printf("Processing snapshot: %+v\n", snapshot)
			parameter := sharedUtils.FindFirst(SDType.GetPayload().Parameters, func(parameter dllModel.SDParameter) bool {
				return parameter.Denotation == snapshot.SDParameter
			})

			if parameter.IsEmpty() {
				continue
			}

			dllSnapshot := dllModel.SDParameterSnapshot{
				SDInstance:  SDInstanceID,
				SDParameter: parameter.GetPayload().ID.GetPayload(),
				String:      sharedUtils.NewOptionalFromPointer(snapshot.String),
				Number:      sharedUtils.NewOptionalFromPointer(snapshot.Number),
				Boolean:     sharedUtils.NewOptionalFromPointer(snapshot.Boolean),
				UpdatedAt:   time.Unix(int64(parameterSnapshotInfoMessage.UpdatedAt), 0),
			}

			log.Printf("Persisting SD parameter snapshot: %+v\n", dllSnapshot)
			snapshotTuplePersistResult := dbClient.GetRelationalDatabaseClientInstance().PersistSDParameterSnapshot(dllSnapshot)
			if snapshotTuplePersistResult.IsSuccess() {
				triggerVPLProgramsForSDParameterSnapshotUpdate(SDInstanceID, parameter.GetPayload().ID.GetPayload())
				select {
				case *parameterSnapshotUpdateSubscriptionChannel <- dll2gql.ToGraphQLModelSdParameterSnapshot(dllSnapshot):
				default:
				}
			} else if kpiFulfillmentCheckResultTuplePersistError := snapshotTuplePersistResult.GetError(); !errors.Is(kpiFulfillmentCheckResultTuplePersistError, dbClient.ErrOperationWouldLeadToForeignKeyIntegrityBreach) {
				log.Printf("failed to persist KPI fulfillment check result tuple: %w", kpiFulfillmentCheckResultTuplePersistError)
			}
		}
		return nil
	}, rabbitMQClient)
}

func triggerVPLProgramsForSDParameterSnapshotUpdate(SDInstanceID uint32, parameterID uint32) {
	vplPrograms := dbClient.GetRelationalDatabaseClientInstance().GetProgramsForSDParameterSnapshot(SDInstanceID, parameterID)
	if vplPrograms.IsSuccess() {
		log.Printf("Found %d programs to trigger for SD parameter snapshot update\n", len(vplPrograms.GetPayload()))
	} else {
		log.Printf("Error fetching programs to trigger for SD parameter snapshot update: %v\n", vplPrograms.GetError())
		return
	}

	for _, program := range vplPrograms.GetPayload() {
		if ExecuteVPLProgramFunc != nil {
			result := ExecuteVPLProgramFunc(program)
			if result.IsSuccess() {
				log.Printf("Successfully executed VPL program %d\n", program.ID)
			} else {
				log.Printf("Error executing VPL program %d: %v\n", program.ID, result.GetError())
			}
		}
	}
}

func EnqueueMessageRepresentingCurrentSDTypeConfiguration(rabbitMQClient rabbitmq.Client) {
	sharedUtils.TerminateOnError(func() error {
		sdTypesLoadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDTypes()
		if sdTypesLoadResult.IsFailure() {
			return sdTypesLoadResult.GetError()
		}
		sdTypeDenotations := sharedUtils.Map[dllModel.SDType, string](sdTypesLoadResult.GetPayload(), func(sdType dllModel.SDType) string {
			return sdType.Denotation
		})
		sdTypeDenotationsJSONSerializationResult := sharedUtils.SerializeToJSON(sdTypeDenotations)
		if sdTypeDenotationsJSONSerializationResult.IsFailure() {
			return sdTypeDenotationsJSONSerializationResult.GetError()
		}
		return rabbitMQClient.PublishJSONMessage(sharedUtils.NewEmptyOptional[string](), sharedUtils.NewOptionalOf(sharedConstants.SetOfSDTypesUpdatesQueueName), sdTypeDenotationsJSONSerializationResult.GetPayload())
	}(), "[ISC] Failed to enqueue RabbitMQ messages representing current SD type configuration")
}

func EnqueueMessageRepresentingCurrentSDInstanceConfiguration(rabbitMQClient rabbitmq.Client) {
	sharedUtils.TerminateOnError(func() error {
		sdInstancesLoadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDInstances()
		if sdInstancesLoadResult.IsFailure() {
			return sdInstancesLoadResult.GetError()
		}
		sdInstancesInfo := sharedUtils.Map[dllModel.SDInstance, sharedModel.SDInstanceInfo](sdInstancesLoadResult.GetPayload(), func(sdInstance dllModel.SDInstance) sharedModel.SDInstanceInfo {
			return sharedModel.SDInstanceInfo{
				SDInstanceUID:   sdInstance.UID,
				ConfirmedByUser: sdInstance.ConfirmedByUser,
			}
		})
		sdInstancesInfoJSONSerializationResult := sharedUtils.SerializeToJSON(sdInstancesInfo)
		if sdInstancesInfoJSONSerializationResult.IsFailure() {
			return sdInstancesInfoJSONSerializationResult.GetError()
		}
		return rabbitMQClient.PublishJSONMessage(sharedUtils.NewEmptyOptional[string](), sharedUtils.NewOptionalOf(sharedConstants.SetOfSDInstancesUpdatesQueueName), sdInstancesInfoJSONSerializationResult.GetPayload())
	}(), "[ISC] Failed to enqueue RabbitMQ messages representing current SD instance configuration")
}

func EnqueueMessageRepresentingCurrentKPIDefinitionConfiguration(rabbitMQClient rabbitmq.Client) {
	sharedUtils.TerminateOnError(func() error {
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
		jsonSerializationResult := sharedUtils.SerializeToJSON(kpiDefinitionsBySDTypeDenotationMap)
		if jsonSerializationResult.IsFailure() {
			return jsonSerializationResult.GetError()
		}
		return rabbitMQClient.PublishJSONMessage(sharedUtils.NewOptionalOf(sharedConstants.BuiltInFanoutExchangeName), sharedUtils.NewEmptyOptional[string](), jsonSerializationResult.GetPayload())
	}(), "[ISC] Failed to enqueue RabbitMQ messages representing current KPI definition configuration")
}

func EnqueueMessagesRepresentingCurrentSystemConfiguration(rabbitMQClient rabbitmq.Client) {
	EnqueueMessageRepresentingCurrentSDTypeConfiguration(rabbitMQClient)
	EnqueueMessageRepresentingCurrentSDInstanceConfiguration(rabbitMQClient)
	EnqueueMessageRepresentingCurrentKPIDefinitionConfiguration(rabbitMQClient)
}
