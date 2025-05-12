package domainLogicLayer

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
	amqp "github.com/rabbitmq/amqp091-go"
)

func CreateVPLProgram(name string, data string) sharedUtils.Result[graphQLModel.VPLProgram] {
	result, err := PerformVPLValidityCheckRequest(sharedModel.VPLInterpretSaveRequestBody{
		Data: data,
	})
	if err != nil {
		log.Printf("Save program failed: %s", err)
		return sharedUtils.NewFailureResult[graphQLModel.VPLProgram](err)
	}
	result.Name = name

	// Extract and save user procedures from the program data
	if err := ExtractAndSaveUserProcedures(data); err != nil {
		log.Printf("Warning: Failed to extract and save user procedures: %s", err)
		// Continue with saving the program even if procedure extraction fails
	}

	dbResult := dbClient.GetRelationalDatabaseClientInstance().PersistVPLProgram(result)
	if dbResult.IsFailure() {
		log.Printf("Save program failed: %s", dbResult.GetError())
		return sharedUtils.NewFailureResult[graphQLModel.VPLProgram](dbResult.GetError())
	}

	return sharedUtils.NewSuccessResult[graphQLModel.VPLProgram](dll2gql.ToGraphQLModelVPLProgram(dbResult.GetPayload()))
}

func UpdateVPLProgram(id uint32, name string, data string) sharedUtils.Result[graphQLModel.VPLProgram] {
	result, err := PerformVPLValidityCheckRequest(sharedModel.VPLInterpretSaveRequestBody{
		Data: data,
	})
	if err != nil {
		log.Printf("Save program failed: %s", err)
		return sharedUtils.NewFailureResult[graphQLModel.VPLProgram](err)
	}

	result.ID = id
	result.Name = name

	// Extract and save user procedures from the program data
	if err := ExtractAndSaveUserProcedures(data); err != nil {
		log.Printf("Warning: Failed to extract and save user procedures: %s", err)
		// Continue with saving the program even if procedure extraction fails
	}

	dbResult := dbClient.GetRelationalDatabaseClientInstance().PersistVPLProgram(result)
	if dbResult.IsFailure() {
		log.Printf("Save program failed: %s", dbResult.GetError())
		return sharedUtils.NewFailureResult[graphQLModel.VPLProgram](dbResult.GetError())
	}

	return sharedUtils.NewSuccessResult[graphQLModel.VPLProgram](dll2gql.ToGraphQLModelVPLProgram(dbResult.GetPayload()))
}

func PerformVPLValidityCheckRequest(input sharedModel.VPLInterpretSaveRequestBody) (dllModel.VPLProgram, error) {
	request := sharedUtils.SerializeToJSON(input)
	rabbitMQClient := getDLLRabbitMQClient()
	correlationId := randomString(32)
	outputChannel := make(chan sharedUtils.Result[sharedModel.VPLProgram])

	go func() {
		client := rabbitmq.NewClient()
		defer client.Dispose()

		err := rabbitmq.ConsumeJSONMessagesWithAccessToDelivery[sharedModel.VPLInterpretSaveResultOrError](
			client,
			sharedConstants.VPLInterpretSaveProgramResponseQueueName,
			correlationId,
			func(vplInterpretSaveResult sharedModel.VPLInterpretSaveResultOrError, delivery amqp.Delivery) error {
				if vplInterpretSaveResult.Error != "" {
					outputChannel <- sharedUtils.NewFailureResult[sharedModel.VPLProgram](errors.New(vplInterpretSaveResult.Error))
				} else {
					outputChannel <- sharedUtils.NewSuccessResult[sharedModel.VPLProgram](vplInterpretSaveResult.Program)
				}

				close(outputChannel)
				return nil
			},
		)

		if err != nil {
			log.Printf("Save program failed: %s", err)
			outputChannel <- sharedUtils.NewFailureResult[sharedModel.VPLProgram](err)
			close(outputChannel)
		}
	}()

	err := rabbitMQClient.PublishJSONMessageRPC(
		sharedUtils.NewEmptyOptional[string](),
		sharedUtils.NewOptionalOf(sharedConstants.VPLInterpretSaveProgramRequestQueueName),
		request.GetPayload(),
		correlationId,
		sharedUtils.NewOptionalOf(sharedConstants.VPLInterpretSaveProgramResponseQueueName),
	)

	if err != nil {
		log.Printf("Save program failed: %s", err)
		return dllModel.VPLProgram{}, err
	}

	result := <-outputChannel

	if result.IsFailure() {
		log.Printf("Save program failed: %s", result.GetError())
		return dllModel.VPLProgram{}, result.GetError()
	}

	return ConvertSharedModelVPLProgramSaveToDLLModel(result.GetPayload())
}

func ConvertSharedModelVPLProgramSaveToDLLModel(program sharedModel.VPLProgram) (dllModel.VPLProgram, error) {
	var SDParameterSnapshotLinkList []dllModel.VPLProgramSDSnapshotLink

	databaseClient := dbClient.GetRelationalDatabaseClientInstance()

	for key, referencedValue := range program.ReferencedValues {
		sdInstance := databaseClient.LoadSDInstanceBasedOnUID(key)

		if sdInstance.IsFailure() || sdInstance.GetPayload().IsEmpty() || sdInstance.GetPayload().GetPayload().ID.IsEmpty() {
			log.Printf("Could not find SD instance")
			return dllModel.VPLProgram{}, fmt.Errorf("could not find SD instance %s", key)
		}

		parameter := sharedUtils.FindFirst(sdInstance.GetPayload().GetPayload().SDType.Parameters, func(parameter dllModel.SDParameter) bool {
			return parameter.Denotation == referencedValue
		})

		if parameter.IsEmpty() || parameter.GetPayload().ID.IsEmpty() {
			log.Printf("Save program failed: %s", errors.New("parameter not found"))
			return dllModel.VPLProgram{}, fmt.Errorf("parameter %s not found", referencedValue)
		}

		SDParameterSnapshotLinkList = append(SDParameterSnapshotLinkList, dllModel.VPLProgramSDSnapshotLink{
			ProgramID:   program.ID,
			InstanceID:  sdInstance.GetPayload().GetPayload().ID.GetPayload(),
			ParameterID: parameter.GetPayload().ID.GetPayload(),
		})
	}

	return dllModel.VPLProgram{
		ID:                   program.ID,
		Name:                 program.Name,
		Data:                 program.Data,
		LastRun:              str2Time(program.LastRun),
		Enabled:              program.Enabled,
		SDParameterSnapshots: SDParameterSnapshotLinkList,
	}, nil
}

func str2Time(str *string) *time.Time {
	if str != nil {
		t, err := time.Parse(time.RFC3339, *str)
		if err != nil {
			return nil
		}
		return &t
	}
	return nil
}

func ExecuteVPLProgram(id uint32) sharedUtils.Result[graphQLModel.VPLProgramExecutionResult] {
	programToExecute := dbClient.GetRelationalDatabaseClientInstance().LoadVPLProgram(id)
	if programToExecute.IsFailure() {
		log.Printf("Execute program failed: %s", programToExecute.GetError())
		return sharedUtils.NewFailureResult[graphQLModel.VPLProgramExecutionResult](programToExecute.GetError())
	}

	rabbitMQClient := getDLLRabbitMQClient()
	correlationId := randomString(32)
	outputChannel := make(chan sharedUtils.Result[sharedModel.VPLInterpretExecuteResultOrError])

	go func() {
		client := rabbitmq.NewClient()
		defer client.Dispose()

		err := rabbitmq.ConsumeJSONMessagesWithAccessToDelivery[sharedModel.VPLInterpretExecuteResultOrError](
			client,
			sharedConstants.VPLInterpretExecuteProgramResponseQueueName,
			correlationId,
			func(vplInterpretExecuteProgramResult sharedModel.VPLInterpretExecuteResultOrError, delivery amqp.Delivery) error {
				if vplInterpretExecuteProgramResult.Error != nil {
					outputChannel <- sharedUtils.NewFailureResult[sharedModel.VPLInterpretExecuteResultOrError](errors.New(*vplInterpretExecuteProgramResult.Error))
				} else {
					outputChannel <- sharedUtils.NewSuccessResult[sharedModel.VPLInterpretExecuteResultOrError](vplInterpretExecuteProgramResult)
				}

				close(outputChannel)
				return nil
			},
		)

		if err != nil {
			log.Printf("Execute program failed: %s", err)
			outputChannel <- sharedUtils.NewFailureResult[sharedModel.VPLInterpretExecuteResultOrError](err)
			close(outputChannel)
		}
	}()

	convertedProgramToExecute, err := toSharedModelVPLProgram(programToExecute.GetPayload())
	if err != nil {
		log.Printf("Execute program failed: %s", err)
		return sharedUtils.NewFailureResult[graphQLModel.VPLProgramExecutionResult](err)
	}
	serializedProgramToExecute := sharedUtils.SerializeToJSON(convertedProgramToExecute)
	if serializedProgramToExecute.IsFailure() {
		log.Printf("Execute program failed: %s", serializedProgramToExecute.GetError())
		return sharedUtils.NewFailureResult[graphQLModel.VPLProgramExecutionResult](serializedProgramToExecute.GetError())
	}

	err = rabbitMQClient.PublishJSONMessageRPC(
		sharedUtils.NewEmptyOptional[string](),
		sharedUtils.NewOptionalOf(sharedConstants.VPLInterpretExecuteProgramRequestQueueName),
		serializedProgramToExecute.GetPayload(),
		correlationId,
		sharedUtils.NewOptionalOf(sharedConstants.VPLInterpretExecuteProgramResponseQueueName),
	)

	if err != nil {
		log.Printf("Execute program failed: %s", err)
		return sharedUtils.NewFailureResult[graphQLModel.VPLProgramExecutionResult](err)
	}

	result := <-outputChannel

	if result.IsFailure() || result.GetPayload().Error != nil {
		log.Printf("Execute program failed: %s", result.GetError())
		return sharedUtils.NewFailureResult[graphQLModel.VPLProgramExecutionResult](result.GetError())
	}

	dllResult := ConvertExecuteResultToDLLModel(result.GetPayload(), programToExecute.GetPayload())
	return sharedUtils.NewSuccessResult[graphQLModel.VPLProgramExecutionResult](dll2gql.ToGraphQLModelPLProgramExecutionResult(dllResult))
}

func StartDeviceInformationRequestConsumer() error {
	databaseClient := dbClient.GetRelationalDatabaseClientInstance()

	client := rabbitmq.NewClient()
	defer client.Dispose()

	err := rabbitmq.ConsumeJSONMessagesWithAccessToDelivery[sharedModel.SDInstanceRequest](
		client,
		sharedConstants.VPLInterpretGetSnapshotsRequestQueueName,
		"",
		func(messagePayload sharedModel.SDInstanceRequest, delivery amqp.Delivery) error {
			log.Printf("Received snapshot request: %v\n", messagePayload)

			var SDInstanceResultInformation sharedModel.VPLInterpretGetDeviceInformationResultOrError

			switch messagePayload.RequestType {
			case "sdCommand":
				sdInstance := databaseClient.LoadSDInstanceBasedOnUID(messagePayload.SDInstanceUID)
				if sdInstance.IsFailure() || sdInstance.GetPayload().IsEmpty() || sdInstance.GetPayload().GetPayload().ID.IsEmpty() {
					log.Printf("Received instance information request failed: InstanceUID: %s, CommandName: %s, RequestType: %s", messagePayload.SDInstanceUID, messagePayload.SDParameterID, messagePayload.RequestType)
					return fmt.Errorf("instance %s not found", messagePayload.SDInstanceUID)
				}
				sdCommand := sharedUtils.FindFirst(sdInstance.GetPayload().GetPayload().SDType.Commands, func(command dllModel.SDCommand) bool {
					return command.Name == messagePayload.SDParameterID
				})
				if sdCommand.IsEmpty() {
					log.Printf("Received instance information request failed: InstanceUID: %s, CommandName: %s, RequestType: %s", messagePayload.SDInstanceUID, messagePayload.SDParameterID, messagePayload.RequestType)
					return fmt.Errorf("command %s not found for instance %s", messagePayload.SDParameterID, messagePayload.SDInstanceUID)
				}

				SDInstanceResultInformation.SDInstanceResultInformation.SDCommandToInvoke = sharedModel.SDCommandToInvoke{
					SDInstanceID:  sdInstance.GetPayload().GetPayload().ID.GetPayload(),
					SDInstanceUID: messagePayload.SDInstanceUID,
					CommandID:     sdCommand.GetPayload().ID,
					CommandName:   sdCommand.GetPayload().Name,
					Payload:       sdCommand.GetPayload().Payload,
				}
			case "sdParameter":
				sdInstance := databaseClient.LoadSDInstanceBasedOnUID(messagePayload.SDInstanceUID)
				if sdInstance.IsFailure() || sdInstance.GetPayload().IsEmpty() || sdInstance.GetPayload().GetPayload().ID.IsEmpty() {
					log.Printf("Received instance information request failed: InstanceUID: %s, CommandName: %s, RequestType: %s", messagePayload.SDInstanceUID, messagePayload.SDParameterID, messagePayload.RequestType)
					return fmt.Errorf("instance %s not found", messagePayload.SDInstanceUID)
				}
				sdParameter := sharedUtils.FindFirst(sdInstance.GetPayload().GetPayload().SDType.Parameters, func(parameter dllModel.SDParameter) bool {
					return parameter.Denotation == messagePayload.SDParameterID
				})
				if sdParameter.IsEmpty() {
					log.Printf("Received instance information request failed: InstanceUID: %s, CommandName: %s, RequestType: %s", messagePayload.SDInstanceUID, messagePayload.SDParameterID, messagePayload.RequestType)
					return fmt.Errorf("parameter not found for instance %s and parameter %s", messagePayload.SDInstanceUID, messagePayload.SDParameterID)
				}

				sdParameterSnapshot := sharedUtils.FindFirst(sdInstance.GetPayload().GetPayload().ParameterSnapshots, func(parameter dllModel.SDParameterSnapshot) bool {
					return parameter.SDParameter == sdParameter.GetPayload().ID.GetPayload()
				})
				if sdParameterSnapshot.IsEmpty() {
					log.Printf("Received instance information request failed: InstanceUID: %s, CommandName: %s, RequestType: %s", messagePayload.SDInstanceUID, messagePayload.SDParameterID, messagePayload.RequestType)
					return fmt.Errorf("parameter snapshot not found for instance %s and parameter %s", messagePayload.SDInstanceUID, messagePayload.SDParameterID)
				}

				SDInstanceResultInformation.SDInstanceResultInformation.SDParameterSnapshotToUpdate = sharedModel.SDParameterSnapshotToUpdate{
					SDInstanceUID: messagePayload.SDInstanceUID,
					SDParameterID: sdParameter.GetPayload().Denotation,
					String:        sdParameterSnapshot.GetPayload().String.ToPointer(),
					Number:        sdParameterSnapshot.GetPayload().Number.ToPointer(),
					Boolean:       sdParameterSnapshot.GetPayload().Boolean.ToPointer(),
				}
			}

			serializedResponse := sharedUtils.SerializeToJSON(SDInstanceResultInformation)
			if serializedResponse.IsFailure() {
				log.Printf("Received snapshot request failed: %s", serializedResponse.GetError())
				return serializedResponse.GetError()
			}

			err := client.PublishJSONMessageRPC(
				sharedUtils.NewEmptyOptional[string](),
				sharedUtils.NewOptionalOf(delivery.ReplyTo),
				serializedResponse.GetPayload(),
				delivery.CorrelationId,
				sharedUtils.NewEmptyOptional[string](),
			)
			if err != nil {
				log.Printf("Received snapshot request failed: %s", err)
				return err
			}

			return nil
		},
	)
	return err
}

func ConvertExecuteResultToDLLModel(programExecutionResult sharedModel.VPLInterpretExecuteResultOrError, executedProgram dllModel.VPLProgram) dllModel.VPLProgramExecutionResult {
	return dllModel.VPLProgramExecutionResult{
		Program: executedProgram,
		SDCommandInvocationList: sharedUtils.Map(programExecutionResult.SDCommandInvocations, func(sdCommandInvocation sharedModel.SDCommandToInvoke) dllModel.SDCommandInvocation {
			return dllModel.SDCommandInvocation{
				InvocationTime: programExecutionResult.ExecutionTime.Format(time.RFC3339),
				Payload:        sdCommandInvocation.Payload,
				CommandID:      sdCommandInvocation.CommandID,
				SDInstanceID:   sdCommandInvocation.SDInstanceID,
			}
		}),
		ExecutionTime:    programExecutionResult.ExecutionTime.Format(time.RFC3339),
		Enabled:          programExecutionResult.Enabled,
		Success:          programExecutionResult.Success,
		Error:            programExecutionResult.Error,
		ExecutionReasion: programExecutionResult.ExecuingReason,
	}
}

func toSharedModelVPLProgram(program dllModel.VPLProgram) (sharedModel.VPLProgram, error) {
	client := dbClient.GetRelationalDatabaseClientInstance()
	referencedValues := make(map[string]string)

	for _, sdParameterSnapshot := range program.SDParameterSnapshots {
		sdInstance := client.LoadSDInstance(sdParameterSnapshot.InstanceID)

		if sdInstance.IsFailure() || sdInstance.GetPayload().ID.IsEmpty() {
			log.Printf("Mapping program from DLL model to shared model failed: %d", sdParameterSnapshot.InstanceID)
			return sharedModel.VPLProgram{}, fmt.Errorf("instance %d not found", sdParameterSnapshot.InstanceID)
		}

		parameter := sharedUtils.FindFirst(sdInstance.GetPayload().SDType.Parameters, func(parameter dllModel.SDParameter) bool {
			return parameter.ID.GetPayload() == sdParameterSnapshot.ParameterID
		})
		if parameter.IsEmpty() {
			log.Printf("Mapping program from DLL model to shared model failed: %d", sdParameterSnapshot.ParameterID)
			return sharedModel.VPLProgram{}, fmt.Errorf("parameter %d not found", sdParameterSnapshot.ParameterID)
		}
		referencedValues[sdInstance.GetPayload().UID] = parameter.GetPayload().Denotation
	}

	// Get linked procedures for this program
	proceduresResult := client.GetProceduresForProgram(program.ID)
	if proceduresResult.IsFailure() {
		log.Printf("Warning: Failed to get procedures for program %d: %s", program.ID, proceduresResult.GetError())
		// Continue without procedures if there's an error
	}

	// Create a map of procedures to include in the program data
	procedures := make(map[string]string)
	if !proceduresResult.IsFailure() {
		for _, procedure := range proceduresResult.GetPayload() {
			procedures[procedure.Name] = procedure.Data
		}
	}

	return sharedModel.VPLProgram{
		ID:               program.ID,
		Name:             program.Name,
		Data:             program.Data,
		ReferencedValues: referencedValues,
		Procedures:       procedures,
	}, nil
}

func GetVPLProgram(id uint32) sharedUtils.Result[graphQLModel.VPLProgram] {
	loadProgramResult := dbClient.GetRelationalDatabaseClientInstance().LoadVPLProgram(id)
	if loadProgramResult.IsFailure() {
		return sharedUtils.NewFailureResult[graphQLModel.VPLProgram](loadProgramResult.GetError())
	}
	return sharedUtils.NewSuccessResult(dll2gql.ToGraphQLModelVPLProgram(loadProgramResult.GetPayload()))
}

func GetVPLPrograms() sharedUtils.Result[[]graphQLModel.VPLProgram] {
	loadProgramsResult := dbClient.GetRelationalDatabaseClientInstance().LoadVPLPrograms()
	if loadProgramsResult.IsFailure() {
		return sharedUtils.NewFailureResult[[]graphQLModel.VPLProgram](loadProgramsResult.GetError())
	}
	return sharedUtils.NewSuccessResult(sharedUtils.Map(loadProgramsResult.GetPayload(), dll2gql.ToGraphQLModelVPLProgram))
}

func DeleteVPLProgram(id uint32) error {
	// Get all procedures linked to this program
	proceduresResult := dbClient.GetRelationalDatabaseClientInstance().GetProceduresForProgram(id)
	if proceduresResult.IsFailure() {
		log.Printf("Warning: Failed to get procedures for program %d: %s", id, proceduresResult.GetError())
	} else {
		// Unlink all procedures from this program
		for _, procedure := range proceduresResult.GetPayload() {
			err := dbClient.GetRelationalDatabaseClientInstance().UnlinkProgramFromProcedure(id, procedure.ID)
			if err != nil {
				log.Printf("Warning: Failed to unlink procedure %d from program %d: %s", procedure.ID, id, err)
			}
		}
	}

	// Delete the program
	return dbClient.GetRelationalDatabaseClientInstance().DeleteVPLProgram(id)
}
