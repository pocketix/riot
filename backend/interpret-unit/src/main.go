package main

import (
	"errors"
	"fmt"
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

			statementList := make([]statements.Statement, 0)
			err := parser.Parse([]byte(messagePayload.Data), variableStore, procedureStore, commandHandlingStore, &statements.ASTCollector{Target: &statementList})

			if err != nil {
				log.Printf("Failed to parse VPL program: %s\n", err.Error())
				return sendExecutionError(rabbitMQClient, delivery, err)
			}

			correlationId := utils.RandomString(32)
			snapshotResponseChannel := make(chan sharedUtils.Result[[]sharedModel.SDParameterSnapshotResponse])

			// Wait for information from devices
			waitForInformationFromDevices(messagePayload, correlationId, snapshotResponseChannel)
			// Send request to get information from devices
			err = sendRequestToGetInformationFromDevices(rabbitMQClient, delivery, commandHandlingStore.ReferencedValueStore, correlationId)
			if err != nil {
				log.Printf("Failed to send request to get information from devices: %s\n", err.Error())
				return sendExecutionError(rabbitMQClient, delivery, err)
			}

			snapshotResponse := <-snapshotResponseChannel
			if snapshotResponse.IsFailure() {
				log.Printf("Failed to get snapshots: %s\n", snapshotResponse.GetError().Error())
				return sendExecutionError(rabbitMQClient, delivery, snapshotResponse.GetError())
			}

			err = commandHandlingStore.ReferencedValueStore.SetValuesToReferenced(utils.SDParameterSnapshotToInterpretModel(snapshotResponse.GetPayload()))
			if err != nil {
				log.Printf("Failed to set values to referenced values: %s\n", err.Error())
				return sendExecutionError(rabbitMQClient, delivery, err)
			}

			var commandInvocationsToSend []sharedModel.SDCommandToInvoke
			var snapshotsToUpdate []sharedModel.SDParameterSnapshotToUpdate

			for _, command := range statementList {
				if deviceCommand, ok := command.(*statements.DeviceCommand); ok {
					deviceCommand, err := deviceCommand.DeviceCommand2ModelsDeviceCommand(commandHandlingStore)
					if err != nil {
						log.Printf("Failed to convert device command: %s\n", err.Error())
						return sendExecutionError(rabbitMQClient, delivery, err)
					}
					cmd, snapshots, err := deviceCommand.SendCommandToDevice()
					if err != nil {
						log.Printf("Failed to send command to device: %s\n", err.Error())
						return sendExecutionError(rabbitMQClient, delivery, err)
					}
					commandInvocationsToSend = append(commandInvocationsToSend, utils.DeviceCommand2SDCommandToInvoke(cmd))
					snapshotsToUpdate = append(snapshotsToUpdate, utils.InterpretParameterSnapshot2SDParameterSnapshotToUpdate(snapshots))
				}
				_, err := command.Execute(variableStore, commandHandlingStore)
				if err != nil {
					log.Printf("Failed to execute command: %s\n", err.Error())
					return sendExecutionError(rabbitMQClient, delivery, err)
				}
			}
			response := sharedModel.VPLInterpretExecuteResultOrError{
				Program:                      messagePayload,
				SDParameterSnapshotsToUpdate: snapshotsToUpdate,
				SDCommandInvocations:         commandInvocationsToSend,
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
			// Close the channel to signal that we are done
			close(snapshotResponseChannel)

			return nil
		},
	)
	return err
}

func waitForInformationFromDevices(messagePayload sharedModel.VPLProgram, correlationId string, snapshotResponseChannel chan sharedUtils.Result[[]sharedModel.SDParameterSnapshotResponse]) {
	go func() {
		newClient := rabbitmq.NewClient()
		defer newClient.Dispose()

		log.Printf("Received VPL program execution request: %v\n", messagePayload)

		err := rabbitmq.ConsumeJSONMessagesWithAccessToDelivery[sharedModel.VPLInterpretGetSnapshotsResultOrError](
			newClient,
			sharedConstants.VPLInterpretGetSnapshotsResponseQueueName,
			correlationId,
			func(messagePayload sharedModel.VPLInterpretGetSnapshotsResultOrError, delivery amqp.Delivery) error {
				if messagePayload.Error != "" {
					snapshotResponseChannel <- sharedUtils.NewFailureResult[[]sharedModel.SDParameterSnapshotResponse](errors.New(messagePayload.Error))
				} else {
					snapshotResponseChannel <- sharedUtils.NewSuccessResult[[]sharedModel.SDParameterSnapshotResponse](messagePayload.SDParameterSnapshotRequest)
				}
				close(snapshotResponseChannel)
				return nil
			},
		)

		if err != nil {
			log.Printf("Failed to consume VPL program execution request: %s\n", err.Error())
			snapshotResponseChannel <- sharedUtils.NewFailureResult[[]sharedModel.SDParameterSnapshotResponse](err)
			close(snapshotResponseChannel)
		}
	}()
}

func sendRequestToGetInformationFromDevices(rabbitMQClient rabbitmq.Client, delivery amqp.Delivery, referencedValueStore *models.ReferencedValueStore, correlationId string) error {
	referencedValues := referencedValueStore.GetReferencedValues()
	var referencedValuesToGet []sharedModel.SDParameterSnapshotRequest
	for instanceID, value := range referencedValues {
		referencedValuesToGet = append(referencedValuesToGet, sharedModel.SDParameterSnapshotRequest{
			SDInstanceUID: instanceID,
			SDParameterID: value.ParameterName,
		})
	}
	convertedReferencedValuesToGet := sharedUtils.SerializeToJSON(referencedValuesToGet)
	if convertedReferencedValuesToGet.IsFailure() {
		log.Printf("Failed to serialize the object representing a VPL program execution result into JSON: %s\n", convertedReferencedValuesToGet.GetError().Error())
		return sendExecutionError(rabbitMQClient, delivery, convertedReferencedValuesToGet.GetError())
	}

	err := rabbitMQClient.PublishJSONMessageRPC(
		sharedUtils.NewEmptyOptional[string](),
		sharedUtils.NewOptionalOf(sharedConstants.VPLInterpretGetSnapshotsRequestQueueName),
		convertedReferencedValuesToGet.GetPayload(),
		correlationId,
		sharedUtils.NewOptionalOf(sharedConstants.VPLInterpretGetSnapshotsResponseQueueName),
	)

	if err != nil {
		log.Printf("Failed to publish VPL program execution result: %s\n", err.Error())
		return sendExecutionError(rabbitMQClient, delivery, err)
	}
	return nil
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

	// Backend Core
	rawBackendCoreURL := sharedUtils.GetEnvironmentVariableValue("BACKEND_CORE_URL").GetPayloadOrDefault("http://riot-backend-core:9090")
	parsedBackendCoreURL, err := url.Parse(rawBackendCoreURL)
	sharedUtils.TerminateOnError(err, fmt.Sprintf("Unable to parse the backend-core URL: %s", rawBackendCoreURL))

	sharedUtils.TerminateOnError(sharedUtils.WaitForDSs(time.Minute, sharedUtils.NewPairOf(parsedBackendCoreURL.Hostname(), parsedBackendCoreURL.Port())), "Some dependencies of this application are inaccessible")
	log.Println("Dependencies should be up and running...")
	sharedUtils.StartLoggingProfilingInformationPeriodically(time.Minute)
	sharedUtils.WaitForAll(
		func() {
			err := performVPLValidityCheckRequest()
			if err != nil {
				log.Println(err.Error())
			}
		},
	)
}
