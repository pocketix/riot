package main

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-MQTT-preprocessor/src/model"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-MQTT-preprocessor/src/mqtt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/rabbitmq"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedConstants"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedUtils"
	"log"
	"sync"
	"time"
)

const (
	mqttBrokerURI      = "mqtt://mosquitto:1883"
	mqttClientID       = "bp-bures-SfPDfSD-MQTT-preprocessor"
	mqttTopic          = "topic"
	mqttBrokerUsername = "admin"
	mqttBrokerPassword = "password"
)

var (
	rabbitMQClient       rabbitmq.Client
	sdTypes              = sharedUtils.NewSet[string]()
	sdTypesMutex         sync.Mutex
	sdInstances          = sharedUtils.NewSet[sharedModel.SDInstanceInfo]()
	sdInstancesMutex     sync.Mutex
	mqttMessageFIFO      = make([][]byte, 0)
	mqttMessageFIFOMutex sync.Mutex
)

func checkForSetOfSDTypesUpdates() {
	err := rabbitmq.ConsumeJSONMessages[sharedModel.SDTypeConfigurationUpdateISCMessage](rabbitMQClient, sharedConstants.SetOfSDTypesUpdatesQueueName, func(messagePayload sharedModel.SDTypeConfigurationUpdateISCMessage) error {
		updatedSDTypes := sharedUtils.NewSetFromSlice(messagePayload)
		sdTypesMutex.Lock()
		sdTypes = updatedSDTypes
		sdTypesMutex.Unlock()
		return nil
	})
	if err != nil {
		log.Printf("Consumption of messages from the '%s' queue has failed", sharedConstants.SetOfSDTypesUpdatesQueueName)
	}
}

func checkForSetOfSDInstancesUpdates() {
	err := rabbitmq.ConsumeJSONMessages[sharedModel.SDInstanceConfigurationUpdateISCMessage](rabbitMQClient, sharedConstants.SetOfSDInstancesUpdatesQueueName, func(messagePayload sharedModel.SDInstanceConfigurationUpdateISCMessage) error {
		updatedSDInstances := sharedUtils.NewSetFromSlice(messagePayload)
		sdInstancesMutex.Lock()
		sdInstances = updatedSDInstances
		sdInstancesMutex.Unlock()
		return nil
	})
	if err != nil {
		log.Printf("Consumption of messages from the '%s' queue has failed", sharedConstants.SetOfSDInstancesUpdatesQueueName)
	}
}

func mqttMessageSDTypeCorrespondsToSDTypeDefinitions(mqttMessageSDType string) bool {
	sdTypesMutex.Lock()
	ok := sdTypes.Contains(mqttMessageSDType)
	sdTypesMutex.Unlock()
	return ok
}

type sdInstanceScenario string

const (
	unknownSDInstance               = "unknown"
	sdInstanceNotYetConfirmedByUser = "notYetConfirmed"
	confirmedSDInstance             = "confirmed"
)

func determineSDInstanceScenario(uid string) sdInstanceScenario {
	var scenario sdInstanceScenario
	sdInstancesMutex.Lock()
	if sdInstances.Contains(sharedModel.SDInstanceInfo{SDInstanceUID: uid, ConfirmedByUser: true}) {
		scenario = confirmedSDInstance
	} else if sdInstances.Contains(sharedModel.SDInstanceInfo{SDInstanceUID: uid, ConfirmedByUser: false}) {
		scenario = sdInstanceNotYetConfirmedByUser
	} else {
		scenario = unknownSDInstance
	}
	sdInstancesMutex.Unlock()
	return scenario
}

func generateKPIFulfillmentCheckRequest(uid string, sdType string, parameters any, timestamp float32) {
	kpiFulfillmentCheckRequestISCMessage := sharedModel.KPIFulfillmentCheckRequestISCMessage{
		Timestamp:           timestamp,
		SDInstanceUID:       uid,
		SDTypeSpecification: sdType,
		Parameters:          parameters,
	}
	jsonSerializationResult := sharedUtils.SerializeToJSON(kpiFulfillmentCheckRequestISCMessage)
	if jsonSerializationResult.IsFailure() {
		log.Println("Failed to serialize the object representing a KPI fulfillment check request into JSON")
	}
	err := rabbitMQClient.EnqueueJSONMessage(sharedConstants.KPIFulfillmentCheckRequestsQueueName, jsonSerializationResult.GetPayload())
	if err != nil {
		log.Println("Failed to publish a KPI fulfillment check request message") // TODO: This is here for debug purposes. Get rid of this line once it becomes unnecessary.
		return
	}
	log.Println("Successfully published a KPI fulfillment check request message") // TODO: This is here for debug purposes. Get rid of this line once it becomes unnecessary.
}

func generateSDInstanceRegistrationRequest(uid string, sdType string, timestamp float32) {
	sdInstanceRegistrationRequestISCMessage := sharedModel.SDInstanceRegistrationRequestISCMessage{
		Timestamp:           timestamp,
		SDInstanceUID:       uid,
		SDTypeSpecification: sdType,
	}
	jsonSerializationResult := sharedUtils.SerializeToJSON(sdInstanceRegistrationRequestISCMessage)
	if jsonSerializationResult.IsFailure() {
		log.Println("Failed to serialize the object representing a SD instance registration request into JSON")
	}
	err := rabbitMQClient.EnqueueJSONMessage(sharedConstants.SDInstanceRegistrationRequestsQueueName, jsonSerializationResult.GetPayload())
	if err != nil {
		log.Println("Failed to publish a SD instance registration request message") // TODO: This is here for debug purposes. Get rid of this line once it becomes unnecessary.
		return
	}
	log.Println("Successfully published a SD instance registration request message") // TODO: This is here for debug purposes. Get rid of this line once it becomes unnecessary.
	sdInstancesMutex.Lock()
	sdInstances.Add(sharedModel.SDInstanceInfo{
		SDInstanceUID:   uid,
		ConfirmedByUser: false,
	})
	sdInstancesMutex.Unlock()
}

func processMQTTMessagePayload(mqttMessagePayload []byte) {
	jsonDeserializationResult := sharedUtils.DeserializeFromJSON[model.UpstreamMQTTMessageInJSONBasedProprietaryFormatOfLogimic](mqttMessagePayload)
	if jsonDeserializationResult.IsFailure() {
		log.Println("Failed to deserialize the JSON payload of MQTT message")
		return
	}
	messagePayloadObject := jsonDeserializationResult.GetPayload()
	sd := messagePayloadObject.Data.SDArray[0]
	if !mqttMessageSDTypeCorrespondsToSDTypeDefinitions(sd.Type) {
		log.Println("Discarding the MQTT message: the SD type does not correspond to the current SD type definitions") // TODO: This is here for debug purposes. Get rid of this line once it becomes unnecessary.
		return
	}
	switch determineSDInstanceScenario(sd.UID) {
	case unknownSDInstance:
		generateSDInstanceRegistrationRequest(sd.UID, sd.Type, messagePayloadObject.Notification.Timestamp)
	case confirmedSDInstance:
		generateKPIFulfillmentCheckRequest(sd.UID, sd.Type, sd.Parameters, messagePayloadObject.Notification.Timestamp)
	case sdInstanceNotYetConfirmedByUser: // TODO: This is here for debug purposes. Get rid of this line once it becomes unnecessary.
		log.Println("Discarding the MQTT message: the SD instance is in the system, but has not yet been confirmed by the user") // TODO: This is here for debug purposes. Get rid of this line once it becomes unnecessary.
	}
}

func checkMQTTMessageFIFO() {
	for {
		mqttMessageFIFOMutex.Lock()
		if len(mqttMessageFIFO) > 0 {
			mqttMessagePayload := mqttMessageFIFO[0]
			processMQTTMessagePayload(mqttMessagePayload)
			mqttMessageFIFO = mqttMessageFIFO[1:]
			mqttMessageFIFOMutex.Unlock()
		} else {
			mqttMessageFIFOMutex.Unlock()
			time.Sleep(time.Millisecond * 100)
		}
	}
}

func addIncomingMQTTMessageToFIFO(incomingMQTTMessagePayload []byte) {
	mqttMessageFIFOMutex.Lock()
	mqttMessageFIFO = append(mqttMessageFIFO, incomingMQTTMessagePayload)
	mqttMessageFIFOMutex.Unlock()
}

func main() {
	sharedUtils.TerminateOnError(sharedUtils.WaitForDSs(time.Minute, sharedUtils.NewPairOf("mosquitto", 1883), sharedUtils.NewPairOf("sfpdfsd-backend-core", 9090)), "Some dependencies of this application are inaccessible")
	rabbitMQClient = rabbitmq.NewClient()
	mqttClient := mqtt.NewEclipsePahoBasedMqttClient(mqttBrokerURI, mqttClientID, mqttBrokerUsername, mqttBrokerPassword)
	sharedUtils.TerminateOnError(mqttClient.Connect(), fmt.Sprintf("Failed to connect to the MQTT broker [%s]", mqttBrokerURI))
	sharedUtils.TerminateOnError(mqttClient.Subscribe(mqttTopic, mqtt.QosAtLeastOnce, addIncomingMQTTMessageToFIFO), fmt.Sprintf("Failed to subscribe to the MQTT topic [%s]", mqttTopic))
	sharedUtils.WaitForAll(checkForSetOfSDTypesUpdates, checkForSetOfSDInstancesUpdates, checkMQTTMessageFIFO)
	rabbitMQClient.Dispose()
}
