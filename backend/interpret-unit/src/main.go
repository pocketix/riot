package main

import (
	"encoding/json"
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
			referencedValueStore := models.NewReferencedValueStore()
			err := parser.Parse([]byte(messagePayload.Data), variableStore, procedureStore, referencedValueStore, &statements.NoOpCollector{})

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
							referencedValueStore.GetReferencedValues(),
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

func ResolveDeviceInformationFunction(deviceUID string, paramDenotation string, infoType string, deviceCommands *[]models.SDInformationFromBackend) (models.SDInformationFromBackend, error) {
	log.Printf("Resolving device information for device UID: %s, parameter denotation: %s, info type: %s\n", deviceUID, paramDenotation, infoType)
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

	log.Printf("Sending VPL program get device information request: %s\n", convertedRequest.GetPayload())
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
			DeviceID:  responsePayload.SDCommandToInvoke.SDInstanceID,
			DeviceUID: deviceUID,
			Command: models.SDCommand{
				CommandID:         responsePayload.SDCommandToInvoke.CommandID,
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
			log.Printf("Received VPL program execution request: %v\n", messagePayload)

			variableStore := models.NewVariableStore()
			procedureStore := models.NewProcedureStore()
			referencedValueStore := models.NewReferencedValueStore()
			referencedValueStore.SetResolveParameterFunction(ResolveDeviceInformationFunction)

			// Create a statement list to hold the parsed program
			statementList := make([]statements.Statement, 0)
			collector := &statements.ASTCollector{Target: &statementList}
			var parseErr error

			// Load procedures from the VPLProgram struct if available
			if messagePayload.Procedures != nil && len(messagePayload.Procedures) > 0 {
				log.Printf("Loading %d procedures from program\n", len(messagePayload.Procedures))

				// Create a modified program data that includes the procedures
				var programJSON map[string]interface{}
				if err := json.Unmarshal([]byte(messagePayload.Data), &programJSON); err != nil {
					log.Printf("Failed to parse program data: %s\n", err.Error())
					return sendExecutionError(rabbitMQClient, delivery, err)
				}

				// Add the procedures to the program data
				programJSON["userProcedures"] = messagePayload.Procedures

				// Marshal the modified program data back to JSON
				modifiedProgramData, err := json.Marshal(programJSON)
				if err != nil {
					log.Printf("Failed to marshal modified program data: %s\n", err.Error())
					return sendExecutionError(rabbitMQClient, delivery, err)
				}

				// Use the modified program data for parsing
				parseErr = parser.Parse(modifiedProgramData, variableStore, procedureStore, referencedValueStore, collector)
			} else {
				// Use the original program data for parsing
				parseErr = parser.Parse([]byte(messagePayload.Data), variableStore, procedureStore, referencedValueStore, collector)
			}

			// Check for parsing errors
			if parseErr != nil {
				log.Printf("Failed to parse VPL program: %s\n", parseErr.Error())
				return sendExecutionError(rabbitMQClient, delivery, parseErr)
			}

			var commandInvocationsToSend []sharedModel.SDCommandToInvoke
			var interpretInvocationsToSend []models.SDCommandInvocation
			// var snapshotsToUpdate []sharedModel.SDParameterSnapshotToUpdate

			for _, command := range statementList {
				_, err := command.Execute(variableStore, referencedValueStore, collector.DeviceCommands, func(deviceCommand models.SDCommandInvocation) {
					interpretInvocationsToSend = append(interpretInvocationsToSend, deviceCommand)
				})
				if err != nil {
					log.Printf("Failed to execute command: %s\n", err.Error())
					return sendExecutionError(rabbitMQClient, delivery, err)
				}
			}
			commandInvocationsToSend = utils.InterpretInvocationsSlice2BackendInvocations(interpretInvocationsToSend)
			response := sharedModel.VPLInterpretExecuteResultOrError{
				Program: messagePayload,
				// SDParameterSnapshotsToUpdate: snapshotsToUpdate,
				SDCommandInvocations: commandInvocationsToSend,
				ExecutionTime: func() *time.Time {
					t := time.Now()
					return &t
				}(),
				Enabled: true,
				Success: true,
				Error:   nil,
				ExecuingReason: func() *string {
					reason := "Manual"
					return &reason
				}(),
			}

			jsonSerializationResult := sharedUtils.SerializeToJSON(response)
			if jsonSerializationResult.IsFailure() {
				log.Printf("Failed to serialize the object representing a VPL program execution result into JSON: %s\n", jsonSerializationResult.GetError().Error())
				return sendExecutionError(rabbitMQClient, delivery, jsonSerializationResult.GetError())
			}

			publishErr := rabbitMQClient.PublishJSONMessageRPC(
				sharedUtils.NewEmptyOptional[string](),
				sharedUtils.NewOptionalOf(delivery.ReplyTo),
				jsonSerializationResult.GetPayload(),
				delivery.CorrelationId,
				sharedUtils.NewEmptyOptional[string](),
			)
			if publishErr != nil {
				log.Printf("Failed to publish VPL program execution result: %s\n", publishErr.Error())
				return sendExecutionError(rabbitMQClient, delivery, publishErr)
			}
			log.Printf("VPL program execution result sent: %s\n", jsonSerializationResult.GetPayload())
			return nil
		},
	)
	return err
}

func sendExecutionError(rabbitMQClient rabbitmq.Client, delivery amqp.Delivery, err error) error {
	response := sharedModel.VPLInterpretExecuteResultOrError{
		Error: func() *string {
			errMsg := err.Error()
			return &errMsg
		}(),
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
		func() {
			err := ExecuteVPLProgramRequest()
			if err != nil {
				log.Println(err.Error())
			}
		},
	)
}
