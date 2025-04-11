package main

import (
	"fmt"
	"log"
	"net/url"
	"os"
	"time"

	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/rabbitmq"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedConstants"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"github.com/pocketix/pocketix-go/src/commands"
	"github.com/pocketix/pocketix-go/src/models"
	"github.com/pocketix/pocketix-go/src/parser"
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
						Name: messagePayload.Name,
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

func executeVPLProgramRequest() {
	rabbitmqClient := rabbitmq.NewClient()
	defer rabbitmqClient.Dispose()

	err := rabbitmq.ConsumeJSONMessages[sharedModel.VPLInterpretProgramRequestMessage](rabbitmqClient, sharedConstants.VPLInterpretProgramRequestQueueName, func(messagePayload sharedModel.VPLInterpretProgramRequestMessage) error {
		variableStore := models.NewVariableStore()
		referencedValueStore := models.NewReferencedValueStore()

		commandList, err := parser.Parse([]byte(messagePayload.ProgramCode), variableStore, referencedValueStore)
		if err != nil {
			log.Printf("Failed to parse VPL program: %s\n", err.Error())
			return err
		}
		for _, command := range commandList {
			if _, ok := command.(*commands.DeviceCommand); ok {
				// Send the command to the device somehow
			} else {
				_, err := command.Execute(variableStore, referencedValueStore)
				if err != nil {
					log.Printf("Failed to execute command: %s\n", err.Error())
					return err
				}
			}
		}

		response := sharedModel.VPLInterpretExecuteResult{
			ProgramID:   messagePayload.ProgramID,
			ProgramName: messagePayload.ProgramName,
			Output:      "Program executed successfully",
		}
		jsonSerializationResult := sharedUtils.SerializeToJSON(response)
		if jsonSerializationResult.IsFailure() {
			log.Printf("Failed to serialize the object representing a VPL program execution result into JSON: %s\n", jsonSerializationResult.GetError().Error())
			return jsonSerializationResult.GetError()
		}

		err = rabbitmqClient.PublishJSONMessage(sharedUtils.NewEmptyOptional[string](), sharedUtils.NewOptionalOf(sharedConstants.VPLInterpretProgramRequestQueueName), jsonSerializationResult.GetPayload())
		if err != nil {
			log.Printf("Failed to publish VPL program execution result: %s\n", err.Error())
			return err
		}
		log.Printf("Successfully processed VPL program execution request for ID %d\n", response.ProgramID)
		return nil
	})

	if err != nil {
		log.Printf("Failed to consume VPL program execution request: %s\n", err.Error())
	}

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
