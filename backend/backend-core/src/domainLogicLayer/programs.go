package domainLogicLayer

import (
	"errors"
	"log"
	"sync"
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
	"golang.org/x/net/context"
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

	dbResult := dbClient.GetRelationalDatabaseClientInstance().PersistVPLProgram(result)
	if dbResult.IsFailure() {
		log.Printf("Save program failed: %s", dbResult.GetError())
		return sharedUtils.NewFailureResult[graphQLModel.VPLProgram](dbResult.GetError())
	}

	return sharedUtils.NewSuccessResult[graphQLModel.VPLProgram](dll2gql.ToGraphQLModelVPLProgram(result))
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

	dbResult := dbClient.GetRelationalDatabaseClientInstance().PersistVPLProgram(result)
	if dbResult.IsFailure() {
		log.Printf("Save program failed: %s", dbResult.GetError())
		return sharedUtils.NewFailureResult[graphQLModel.VPLProgram](dbResult.GetError())
	}

	return sharedUtils.NewSuccessResult[graphQLModel.VPLProgram](dll2gql.ToGraphQLModelVPLProgram(result))
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

		if sdInstance.IsFailure() || sdInstance.GetPayload().IsEmpty() {
			log.Printf("Could not find SD instance")
			return dllModel.VPLProgram{}, errors.New("could not find SD instance")
		}

		sdType := databaseClient.LoadSDType(sdInstance.GetPayload().GetPayload().SDType.ID.GetPayload())
		if sdType.IsFailure() || sdType.GetPayload().ID.IsEmpty() {
			log.Printf("Could not find SD type")
			return dllModel.VPLProgram{}, errors.New("could not find SD type")
		}

		parameter := sharedUtils.FindFirst(sdType.GetPayload().Parameters, func(parameter dllModel.SDParameter) bool {
			return parameter.Denotation == referencedValue
		})

		if parameter.IsEmpty() {
			log.Printf("Save program failed: %s", errors.New("parameter not found"))
			return dllModel.VPLProgram{}, errors.New("parameter not found")
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
	programToExecute := GetVPLProgram(id)
	if programToExecute.IsFailure() {
		log.Printf("Execute program failed: %s", programToExecute.GetError())
		return sharedUtils.NewFailureResult[graphQLModel.VPLProgramExecutionResult](programToExecute.GetError())
	}

	rabbitMQClient := getDLLRabbitMQClient()
	correlationId := randomString(32)
	outputChannel := make(chan sharedUtils.Result[sharedModel.VPLInterpretExecuteResultOrError])

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	var wg sync.WaitGroup
	wg.Add(1)

	go startSnapshotRequestListener(ctx, &wg)

	go func() {
		client := rabbitmq.NewClient()
		defer client.Dispose()

		err := rabbitmq.ConsumeJSONMessagesWithAccessToDelivery[sharedModel.VPLInterpretExecuteResultOrError](
			client,
			sharedConstants.VPLInterpretExecuteProgramResponseQueueName,
			correlationId,
			func(vplInterpretExecuteProgramResult sharedModel.VPLInterpretExecuteResultOrError, delivery amqp.Delivery) error {
				if vplInterpretExecuteProgramResult.Error != "" {
					outputChannel <- sharedUtils.NewFailureResult[sharedModel.VPLInterpretExecuteResultOrError](errors.New(vplInterpretExecuteProgramResult.Error))
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
	cancel()
	wg.Wait()

	if result.IsFailure() {
		log.Printf("Execute program failed: %s", result.GetError())
		return sharedUtils.NewFailureResult[graphQLModel.VPLProgramExecutionResult](result.GetError())
	}

	dllResult, err := ConvertSharedModelVPLProgramExecuteToDLLModel(result.GetPayload())
	if err != nil {
		log.Printf("Execute program failed: %s", err)
		return sharedUtils.NewFailureResult[graphQLModel.VPLProgramExecutionResult](err)
	}

	return sharedUtils.NewSuccessResult[graphQLModel.VPLProgramExecutionResult](dll2gql.ToGraphQLModelPLProgramExecutionResult(dllResult))
}

func startSnapshotRequestListener(ctx context.Context, wg *sync.WaitGroup) {
	defer wg.Done()
	databaseClient := dbClient.GetRelationalDatabaseClientInstance()

	client := rabbitmq.NewClient()
	defer client.Dispose()

	err := rabbitmq.ConsumeJSONMessagesWithAccessToDelivery[[]sharedModel.SDParameterSnapshotRequest](
		client,
		sharedConstants.VPLInterpretGetSnapshotsResponseQueueName,
		"",
		func(messagePayload []sharedModel.SDParameterSnapshotRequest, delivery amqp.Delivery) error {
			select {
			case <-ctx.Done():
				log.Printf("Snapshot request listener stopped")
				return nil
			default:
			}
			parameterSnapshotRequestList := make([]sharedModel.SDParameterSnapshotResponse, 0)
			if messagePayload == nil {
				log.Printf("Received empty snapshot request")
			} else {
				log.Printf("Received snapshot request: %v\n", messagePayload)

				for _, snapshot := range messagePayload {
					sdInstance := databaseClient.LoadSDInstanceBasedOnUID(snapshot.SDInstanceUID)
					if sdInstance.IsFailure() {
						log.Printf("Received snapshot request failed: %s", sdInstance.GetError())
						return sdInstance.GetError()
					}
					sdSnapshotResponse, err := toSharedModelSnapshotResponse(snapshot, sdInstance.GetPayload().GetPayload())
					if err != nil {
						log.Printf("Received snapshot request failed: %s", err)
						return err
					}
					parameterSnapshotRequestList = append(parameterSnapshotRequestList, sdSnapshotResponse)
				}
			}

			serializedResponse := sharedUtils.SerializeToJSON(parameterSnapshotRequestList)
			if serializedResponse.IsFailure() {
				log.Printf("Received snapshot request failed: %s", serializedResponse.GetError())
				return serializedResponse.GetError()
			}

			err := client.PublishJSONMessageRPC(
				sharedUtils.NewEmptyOptional[string](),
				sharedUtils.NewOptionalOf(sharedConstants.VPLInterpretGetSnapshotsRequestQueueName),
				serializedResponse.GetPayload(),
				delivery.CorrelationId,
				sharedUtils.NewOptionalOf(sharedConstants.VPLInterpretGetSnapshotsResponseQueueName),
			)
			if err != nil {
				log.Printf("Received snapshot request failed: %s", err)
				return err
			}

			return nil
		},
	)

	if err != nil {
		log.Printf("Received snapshot request failed: %s", err)
	}
}

func toSharedModelSnapshotResponse(snapshot sharedModel.SDParameterSnapshotRequest, instance dllModel.SDInstance) (sharedModel.SDParameterSnapshotResponse, error) {
	var sdParameterDenotation string
	return sharedModel.SDParameterSnapshotResponse{
		SDInstanceUID: snapshot.SDInstanceUID,
		SDType: sharedModel.SDType{
			SDParameters: sharedUtils.Map(instance.SDType.Parameters, func(parameter dllModel.SDParameter) sharedModel.SDParameter {
				sdParameterDenotation = parameter.Denotation
				return sharedModel.SDParameter{
					ParameterID:         parameter.ID.GetPayload(),
					ParameterDenotation: parameter.Denotation,
				}
			}),
			SDCommands: sharedUtils.Map(instance.CommandInvocations, func(command dllModel.SDCommandInvocation) sharedModel.SDCommand {
				concreteCommand := dbClient.GetRelationalDatabaseClientInstance().LoadSDCommand(command.CommandID)
				if concreteCommand.IsFailure() {
					log.Printf("Save program failed: %s", concreteCommand.GetError())
					return sharedModel.SDCommand{}
				}
				return sharedModel.SDCommand{
					CommandID:         concreteCommand.GetPayload().ID,
					CommandDenotation: concreteCommand.GetPayload().Name,
				}
			}),
		},
		SDParameterSnapshots: sharedUtils.Map(instance.ParameterSnapshots, func(parameter dllModel.SDParameterSnapshot) sharedModel.SDParameterSnapshot {
			return sharedModel.SDParameterSnapshot{
				SDParameter: sdParameterDenotation,
				String:      parameter.String.ToPointer(),
				Number:      parameter.Number.ToPointer(),
				Boolean:     parameter.Boolean.ToPointer(),
			}
		}),
	}, nil
}

func toSharedModelVPLProgram(program graphQLModel.VPLProgram) (sharedModel.VPLProgram, error) {
	client := dbClient.GetRelationalDatabaseClientInstance()
	referencedValues := make(map[string]string)

	for _, sdParameterSnapshot := range program.SdParameterSnapshots {
		sdInstance := client.LoadSDInstance(sdParameterSnapshot.InstanceID)
		sdType := client.LoadSDType(sdParameterSnapshot.ParameterID)

		if sdInstance.IsFailure() || sdType.IsFailure() {
			log.Printf("Save program failed: %s", sdInstance.GetError())
			return sharedModel.VPLProgram{}, sdInstance.GetError()
		}

		parameter := sharedUtils.FindFirst(sdType.GetPayload().Parameters, func(parameter dllModel.SDParameter) bool {
			return parameter.ID.GetPayload() == sdParameterSnapshot.ParameterID
		})
		if parameter.IsEmpty() {
			log.Printf("Save program failed: %s", errors.New("parameter not found"))
			return sharedModel.VPLProgram{}, errors.New("parameter not found")
		}
		referencedValues[sdInstance.GetPayload().UID] = parameter.GetPayload().Denotation
	}
	return sharedModel.VPLProgram{
		ID:               program.ID,
		Name:             program.Name,
		Data:             program.Data,
		ReferencedValues: referencedValues,
	}, nil
}

func ConvertSharedModelVPLProgramExecuteToDLLModel(program sharedModel.VPLInterpretExecuteResultOrError) (dllModel.VPLProgramExecutionResult, error) {
	var SDParameterSnapshotList []dllModel.SDParameterSnapshot
	var SDCommandInvocationList []dllModel.SDCommandInvocation
	databaseClient := dbClient.GetRelationalDatabaseClientInstance()

	for _, sdParameterSnapshot := range program.SDParameterSnapshotsToUpdate {
		sdInstance := databaseClient.LoadSDInstanceBasedOnUID(sdParameterSnapshot.SDInstanceUID)
		sdType := databaseClient.LoadSDTypeBasedOnDenotation(sdParameterSnapshot.SDParameterID)

		if sdInstance.IsFailure() || sdType.IsFailure() {
			log.Printf("Execute program failed: %s", sdInstance.GetError())
			return dllModel.VPLProgramExecutionResult{}, sdInstance.GetError()
		}

		parameter := sharedUtils.FindFirst(sdType.GetPayload().Parameters, func(parameter dllModel.SDParameter) bool {
			return parameter.Denotation == sdParameterSnapshot.SDParameterID
		})

		SDParameterSnapshotList = append(SDParameterSnapshotList, dllModel.SDParameterSnapshot{
			SDInstance:  sdInstance.GetPayload().GetPayload().ID.GetPayload(),
			SDParameter: parameter.GetPayload().ID.GetPayload(),
			String:      sharedUtils.NewOptionalFromPointer(sdParameterSnapshot.String),
			Number:      sharedUtils.NewOptionalFromPointer(sdParameterSnapshot.Number),
			Boolean:     sharedUtils.NewOptionalFromPointer(sdParameterSnapshot.Boolean),
			UpdatedAt:   time.Now(),
		})

	}

	for _, sdCommandInvocation := range program.SDCommandInvocations {
		sdInstance := databaseClient.LoadSDInstanceBasedOnUID(sdCommandInvocation.SDInstanceUID)
		sdType := sdInstance.GetPayload().GetPayload().SDType

		if sdInstance.IsFailure() {
			log.Printf("Execute program failed: %s", sdInstance.GetError())
			return dllModel.VPLProgramExecutionResult{}, sdInstance.GetError()
		}
		sdCommandsResult := databaseClient.LoadSDCommands()
		if sdCommandsResult.IsFailure() {
			log.Printf("Execute program failed: %s", sdCommandsResult.GetError())
			return dllModel.VPLProgramExecutionResult{}, sdCommandsResult.GetError()
		}
		sdCommands := sharedUtils.Filter(sdCommandsResult.GetPayload(), func(command dllModel.SDCommand) bool {
			return command.SdTypeID == sdType.ID.GetPayload()
		})

		command := sharedUtils.FindFirst(sdCommands, func(command dllModel.SDCommand) bool {
			return command.Name == sdCommandInvocation.CommandName
		})

		if command.IsEmpty() {
			log.Printf("Execute program failed: %s", errors.New("command not found"))
			return dllModel.VPLProgramExecutionResult{}, errors.New("command not found")
		}

		SDCommandInvocationList = append(SDCommandInvocationList, dllModel.SDCommandInvocation{
			SDInstanceID: sdInstance.GetPayload().GetPayload().ID.GetPayload(),
			CommandID:    command.GetPayload().ID,
		})
	}
	return dllModel.VPLProgramExecutionResult{
		Program: dllModel.VPLProgram{
			ID:   program.Program.ID,
			Name: program.Program.Name,
			Data: program.Program.Data,
		},
		SDParameterSnapshotList: SDParameterSnapshotList,
		SDCommandInvocationList: SDCommandInvocationList,
		ExecutionTime:           time.Now().Format(time.RFC3339),
		Enabled:                 true,
		Success:                 true,
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
	return dbClient.GetRelationalDatabaseClientInstance().DeleteVPLProgram(id)
}
