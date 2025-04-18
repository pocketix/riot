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
	amqp "github.com/rabbitmq/amqp091-go"
)

func PerformVPLValidityCheckRequest() error {
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
			referencedValueStore := models.NewReferencedValueStore()
			err := parser.ParseWithoutExecuting([]byte(messagePayload.Data), variableStore, referencedValueStore)

			if err != nil {
				log.Printf("Failed to parse VPL program: %s\n", err.Error())

				response = sharedModel.VPLInterpretSaveResultOrError{
					Error: err.Error(),
				}
			} else {
				response = sharedModel.VPLInterpretSaveResultOrError{
					Program: sharedModel.VPLProgram{
						Data: messagePayload.Data,
						// ReferencedValues: referencedValueStore.GetReferencedValues(),
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

	err := rabbitmq.ConsumeJSONMessagesWithAccessToDelivery[sharedModel.VPLProgram](
		rabbitMQClient,
		sharedConstants.VPLInterpretExecuteProgramRequestQueueName,
		"",
		func(messagePayload sharedModel.VPLProgram, delivery amqp.Delivery) error {
			go func() {
				newClient := rabbitmq.NewClient()
				defer newClient.Dispose()
				correlationId := utils.RandomString(32)
				outputChannel := make(chan sharedUtils.Result[[]sharedModel.SDParameterSnapshotValue])

				log.Printf("Received VPL program execution request: %v\n", messagePayload)

				err := rabbitmq.ConsumeJSONMessagesWithAccessToDelivery[sharedModel.VPLInterpretGetSnapshotsResultOrError](
					newClient,
					sharedConstants.VPLInterpretGetSnapshotsResponseQueueName,
					correlationId,
					func(messagePayload sharedModel.VPLInterpretGetSnapshotsResultOrError, delivery amqp.Delivery) error {
						if messagePayload.Error != "" {
							outputChannel <- sharedUtils.NewFailureResult[[]sharedModel.SDParameterSnapshotValue](errors.New(messagePayload.Error))
						} else {
							outputChannel <- sharedUtils.NewSuccessResult[[]sharedModel.SDParameterSnapshotValue](messagePayload.SDParameterSnapshotsValues)
						}
						close(outputChannel)
						return nil
					},
				)

				if err != nil {
					log.Printf("Failed to consume VPL program execution request: %s\n", err.Error())
					outputChannel <- sharedUtils.NewFailureResult[[]sharedModel.SDParameterSnapshotValue](err)
					close(outputChannel)
				}
			}()

			// referencedValues := referencedValueStore.GetReferencedValues()
			// err := rabbitMQClient.PublishJSONMessageRPC(
			// 	sharedUtils.NewEmptyOptional[string](),
			// 	sharedUtils.NewOptionalOf(sharedConstants.VPLInterpretGetSnapshotsRequestQueueName),

			return nil
		},
	)
	return err
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
			err := PerformVPLValidityCheckRequest()
			if err != nil {
				log.Println(err.Error())
			}
		},
	)
}
