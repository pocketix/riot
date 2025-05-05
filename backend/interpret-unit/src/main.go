package main

import (
	"errors"
	"fmt"
	"io"
	"log"
	"net/url"
	"os"
	"time"

	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/rabbitmq"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedConstants"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"github.com/pocketix/interpret-unit/src/utils"
	"github.com/pocketix/pocketix-go/src/models"
	"github.com/pocketix/pocketix-go/src/parser"
	"github.com/pocketix/pocketix-go/src/services"
	"github.com/pocketix/pocketix-go/src/statements"
	amqp "github.com/rabbitmq/amqp091-go"
)

func performVPLValidityCheckRequest() error {
	rabbitMQClient := rabbitmq.NewClient()
	defer rabbitMQClient.Dispose()

	err := rabbitmq.ConsumeJSONMessagesWithAccessToDelivery[sharedModel.VPLInterpretSaveRequestBody](
		rabbitMQClient,
		sharedConstants.VPLInterpretSaveProgramRequestQueueName,
		"",
		func(messagePayload sharedModel.VPLInterpretSaveRequestBody, delivery amqp.Delivery) error {
			log.Printf("Received VPL program save request: %v\n", messagePayload)

			var response sharedModel.VPLInterpretSaveResultOrError

			variableStore := models.NewVariableStore()
			procedureStore := models.NewProcedureStore()
			commandHandlingStore := models.NewCommandsHandlingStore()
			err := parser.Parse([]byte(messagePayload.Data), variableStore, procedureStore, commandHandlingStore, &statements.NoOpCollector{})

			if err != nil {
				log.Printf("Failed to parse VPL program: %s\n", err.Error())

				response = sharedModel.VPLInterpretSaveResultOrError{
					Error: err.Error(),
				}
			} else {
				response = sharedModel.VPLInterpretSaveResultOrError{
					Program: sharedModel.VPLProgram{
						Data:    messagePayload.Data,
						Enabled: false,
						ReferencedValues: utils.ReferencedValue2StringMap(
							commandHandlingStore.ReferencedValueStore.GetReferencedValues(),
						),
					},
				}
			}
			jsonSerializationResult := sharedUtils.SerializeToJSON(response)
			if jsonSerializationResult.IsFailure() {
				log.Printf("Failed to serialize the object representing a VPL program save result into JSON: %s\n", jsonSerializationResult.GetError().Error())
				return jsonSerializationResult.GetError()
			}

			err = rabbitMQClient.PublishJSONMessageRPC(
				sharedUtils.NewEmptyOptional[string](),
				sharedUtils.NewOptionalOf(delivery.ReplyTo),
				jsonSerializationResult.GetPayload(),
				delivery.CorrelationId,
				sharedUtils.NewEmptyOptional[string](),
			)

			if err != nil {
				log.Printf("Failed to publish VPL program save result: %s\n", err.Error())
				return err
			}
			return nil
		},
	)
	return err
}

func ResolveDeviceInformationFunction(deviceUID string, paramDenotation string, infoType string) (models.SDInformationFromBackend, error) {
	rabbitMQClient := rabbitmq.NewClient()
	defer rabbitMQClient.Dispose()

	correlationId := utils.RandomString(32)
	responseChannel := make(chan sharedUtils.Result[sharedModel.SDInstanceResultInformation])

	go func() {
		client := rabbitmq.NewClient()
		defer client.Dispose()

		err := rabbitmq.ConsumeJSONMessagesWithAccessToDelivery[sharedModel.VPLInterpretGetDeviceInformationResultOrError](
			client,
			sharedConstants.VPLInterpretGetSnapshotsResponseQueueName,
			correlationId,
			func(messagePayload sharedModel.VPLInterpretGetDeviceInformationResultOrError, delivery amqp.Delivery) error {
				if messagePayload.Error != "" {
					responseChannel <- sharedUtils.NewFailureResult[sharedModel.SDInstanceResultInformation](errors.New(messagePayload.Error))
				} else {
					responseChannel <- sharedUtils.NewSuccessResult[sharedModel.SDInstanceResultInformation](messagePayload.SDInstanceResultInformation)
				}

				close(responseChannel)
				return nil
			},
		)

		if err != nil {
			log.Printf("Failed to consume VPL program get snapshot request: %s\n", err.Error())
			responseChannel <- sharedUtils.NewFailureResult[sharedModel.SDInstanceResultInformation](err)
			close(responseChannel)
		}
	}()

	request := sharedModel.SDInstanceRequest{
		SDInstanceUID: deviceUID,
		SDParameterID: paramDenotation,
		RequestType:   infoType,
	}
	convertedRequest := sharedUtils.SerializeToJSON(request)
	if convertedRequest.IsFailure() {
		log.Printf("Failed to serialize the object representing a VPL program get snapshot request into JSON: %s\n", convertedRequest.GetError().Error())
		return models.SDInformationFromBackend{}, convertedRequest.GetError()
	}

	err := rabbitMQClient.PublishJSONMessageRPC(
		sharedUtils.NewEmptyOptional[string](),
		sharedUtils.NewOptionalOf(sharedConstants.VPLInterpretGetSnapshotsRequestQueueName),
		convertedRequest.GetPayload(),
		correlationId,
		sharedUtils.NewOptionalOf(sharedConstants.VPLInterpretGetSnapshotsResponseQueueName),
	)

	if err != nil {
		log.Printf("Failed to publish VPL program get snapshot request: %s\n", err.Error())
		return models.SDInformationFromBackend{}, err
	}
	response := <-responseChannel
	if response.IsFailure() {
		log.Printf("Failed to get snapshot: %s\n", response.GetError().Error())
		return models.SDInformationFromBackend{}, response.GetError()
	}

	responsePayload := response.GetPayload()
	switch infoType {
	case "sdCommand":
		return models.SDInformationFromBackend{
			DeviceUID: deviceUID,
			Command: models.SDCommand{
				CommandDenotation: responsePayload.SDCommandToInvoke.CommandName,
				Payload:           responsePayload.SDCommandToInvoke.Payload,
			},
		}, nil
	case "sdParameter":
		return models.SDInformationFromBackend{
			DeviceUID: deviceUID,
			Snapshot: models.SDParameterSnapshot{
				SDParameter: responsePayload.SDParameterSnapshotToUpdate.SDParameterID,
				String:      responsePayload.SDParameterSnapshotToUpdate.String,
				Number:      responsePayload.SDParameterSnapshotToUpdate.Number,
				Boolean:     responsePayload.SDParameterSnapshotToUpdate.Boolean,
			},
		}, nil
	default:
		return models.SDInformationFromBackend{}, fmt.Errorf("unknown request type: %s", infoType)
	}
}

func ExecuteVPLProgramRequest() error {
	rabbitMQClient := rabbitmq.NewClient()
	defer rabbitMQClient.Dispose()

	// Processing VPL program execution requests
	err := rabbitmq.ConsumeJSONMessagesWithAccessToDelivery[sharedModel.VPLProgram](
		rabbitMQClient,
		sharedConstants.VPLInterpretExecuteProgramRequestQueueName,
		"",
		func(messagePayload sharedModel.VPLProgram, delivery amqp.Delivery) error {
			variableStore := models.NewVariableStore()
			procedureStore := models.NewProcedureStore()
			commandHandlingStore := models.NewCommandsHandlingStore()
			commandHandlingStore.ReferencedValueStore.SetResolveParameterFunction(ResolveDeviceInformationFunction)

			statementList := make([]statements.Statement, 0)
			err := parser.Parse([]byte(messagePayload.Data), variableStore, procedureStore, commandHandlingStore, &statements.ASTCollector{Target: &statementList})

			if err != nil {
				log.Printf("Failed to parse VPL program: %s\n", err.Error())
				return sendExecutionError(rabbitMQClient, delivery, err)
			}

			var commandInvocationsToSend []sharedModel.SDCommandToInvoke
			// var snapshotsToUpdate []sharedModel.SDParameterSnapshotToUpdate

			for _, command := range statementList {
				if deviceCommand, ok := command.(*statements.DeviceCommand); ok {
					deviceCommand, err := deviceCommand.DeviceCommand2ModelsDeviceCommand(commandHandlingStore)
					if err != nil {
						log.Printf("Failed to convert device command: %s\n", err.Error())
						return sendExecutionError(rabbitMQClient, delivery, err)
					}
					sdCommandInformation, err := commandHandlingStore.ReferencedValueStore.ResolveDeviceInformationFunction(deviceCommand.DeviceUID, deviceCommand.CommandDenotation, "sdCommand")
					if err != nil {
						log.Printf("Failed to send command to device: %s\n", err.Error())
						return sendExecutionError(rabbitMQClient, delivery, err)
					}
					sdCommandInvocation, err := deviceCommand.PrepareCommandToSend(sdCommandInformation)
					if err != nil {
						log.Printf("Failed to prepare command to send: %s\n", err.Error())
						return sendExecutionError(rabbitMQClient, delivery, err)
					}
					commandInvocationsToSend = append(commandInvocationsToSend, utils.InterpretSDCommandInvocation2SharedModelCommandInvocation(sdCommandInvocation))
					continue
				}
				_, err := command.Execute(variableStore, commandHandlingStore)
				if err != nil {
					log.Printf("Failed to execute command: %s\n", err.Error())
					return sendExecutionError(rabbitMQClient, delivery, err)
				}
			}
			response := sharedModel.VPLInterpretExecuteResultOrError{
				Program: messagePayload,
				// SDParameterSnapshotsToUpdate: snapshotsToUpdate,
				SDCommandInvocations: commandInvocationsToSend,
			}

			jsonSerializationResult := sharedUtils.SerializeToJSON(response)
			if jsonSerializationResult.IsFailure() {
				log.Printf("Failed to serialize the object representing a VPL program execution result into JSON: %s\n", jsonSerializationResult.GetError().Error())
				return sendExecutionError(rabbitMQClient, delivery, jsonSerializationResult.GetError())
			}

			err = rabbitMQClient.PublishJSONMessageRPC(
				sharedUtils.NewEmptyOptional[string](),
				sharedUtils.NewOptionalOf(delivery.ReplyTo),
				jsonSerializationResult.GetPayload(),
				delivery.CorrelationId,
				sharedUtils.NewEmptyOptional[string](),
			)
			if err != nil {
				log.Printf("Failed to publish VPL program execution result: %s\n", err.Error())
				return sendExecutionError(rabbitMQClient, delivery, err)
			}
			log.Printf("VPL program execution result sent: %s\n", jsonSerializationResult.GetPayload())
			return nil
		},
	)
	return err
}

func sendExecutionError(rabbitMQClient rabbitmq.Client, delivery amqp.Delivery, err error) error {
	response := sharedModel.VPLInterpretExecuteResultOrError{
		Error: err.Error(),
	}
	jsonSerializationResult := sharedUtils.SerializeToJSON(response)
	if jsonSerializationResult.IsFailure() {
		log.Printf("Failed to serialize the object representing a VPL program execution result into JSON: %s\n", jsonSerializationResult.GetError().Error())
		return jsonSerializationResult.GetError()
	}
	err = rabbitMQClient.PublishJSONMessageRPC(
		sharedUtils.NewEmptyOptional[string](),
		sharedUtils.NewOptionalOf(delivery.ReplyTo),
		jsonSerializationResult.GetPayload(),
		delivery.CorrelationId,
		sharedUtils.NewEmptyOptional[string](),
	)
	if err != nil {
		log.Printf("Failed to publish VPL program execution result: %s\n", err.Error())
		return err
	}
	return nil
}

func main() {
	log.SetOutput(os.Stderr)
	log.Println("Interpret Unit started")
	services.SetOutput(io.Discard)

	// Backend Core
	rawBackendCoreURL := sharedUtils.GetEnvironmentVariableValue("BACKEND_CORE_URL").GetPayloadOrDefault("http://riot-backend-core:9090")
	parsedBackendCoreURL, err := url.Parse(rawBackendCoreURL)
	sharedUtils.TerminateOnError(err, fmt.Sprintf("Unable to parse the backend-core URL: %s", rawBackendCoreURL))

	sharedUtils.TerminateOnError(sharedUtils.WaitForDSs(time.Minute, sharedUtils.NewPairOf(parsedBackendCoreURL.Hostname(), parsedBackendCoreURL.Port())), "Some dependencies of this application are inaccessible")
	log.Println("Dependencies should be up and running...")

	if sharedUtils.GetEnvironmentVariableValue("ENABLE_PROFILING").GetPayloadOrDefault("false") == "true" {
		sharedUtils.StartLoggingProfilingInformationPeriodically(time.Minute)
	}
	sharedUtils.WaitForAll(
		func() {
			err := performVPLValidityCheckRequest()
			if err != nil {
				log.Println(err.Error())
			}
		},
	)
}
