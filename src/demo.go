package main

import (
	"encoding/json"
	"log"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

const (
	mqttBrokerUri      = "mqtt://localhost:1883"
	mqttClientId       = "go-mqtt-client-test"
	mqttTopic          = "demo/eclipse-paho-go-client"
	mqttBrokerUsername = "admin"
	mqttBrokerPassword = "password"
)

var relationalDatabaseClient RelationalDatabaseClient = nil
var numericKeyPerformanceIndicatorDefinitionsPerDeviceTypeRegistry map[string][]NumericKeyPerformanceIndicatorDefinition

func performNumericKpiEvaluation(upstreamMessage UpstreamMessage) {

	var err error

	device := upstreamMessage.Data.Devices[0] // TODO: Just one device? Or multiple? And how many?
	deviceType := device.DeviceType
	numericKeyPerformanceIndicatorDefinitionsForTheGivenDeviceType, isDeviceTypePresent := numericKeyPerformanceIndicatorDefinitionsPerDeviceTypeRegistry[deviceType]
	if !isDeviceTypePresent {
		numericKeyPerformanceIndicatorDefinitionsForTheGivenDeviceType, err = relationalDatabaseClient.ObtainNumericKeyPerformanceIndicatorDefinitionsForCertainDeviceType(deviceType)
		if err != nil {
			log.Printf("Could not load the numeric KPI definitions for the device type '%s' from the database: cannot proceed with evaluation.\n", deviceType)
			return
		}
	}

	for _, numericKeyPerformanceIndicatorDefinition := range numericKeyPerformanceIndicatorDefinitionsForTheGivenDeviceType {

		deviceParameterValue := device.DeviceParameters.(map[string]interface{})[numericKeyPerformanceIndicatorDefinition.DeviceParameter].(float64)
		var kpiOk bool
		switch numericKeyPerformanceIndicatorDefinition.ComparisonType {
		case "equal_to":
			kpiOk = deviceParameterValue == numericKeyPerformanceIndicatorDefinition.FirstNumericValue
		case "smaller_than":
			kpiOk = deviceParameterValue < numericKeyPerformanceIndicatorDefinition.FirstNumericValue
		case "greater_than":
			kpiOk = deviceParameterValue > numericKeyPerformanceIndicatorDefinition.FirstNumericValue
		case "in_range":
			kpiOk = deviceParameterValue > numericKeyPerformanceIndicatorDefinition.FirstNumericValue && deviceParameterValue < numericKeyPerformanceIndicatorDefinition.SecondNumericValue
		}

		kpiStatusText := "OK"
		if !kpiOk {
			kpiStatusText = "NOT OK"
		}
		log.Printf("KPI: %s: %s\n", numericKeyPerformanceIndicatorDefinition.HumanReadableDescription, kpiStatusText)
	}
}

func handleIncomingMessage(_ mqtt.Client, incomingMessage mqtt.Message) {

	log.Println("Incoming MQTT message payload: ", string(incomingMessage.Payload()))

	var deserializedPayloadOfTheIncomingUpstreamMessage UpstreamMessage
	if err := json.Unmarshal(incomingMessage.Payload(), &deserializedPayloadOfTheIncomingUpstreamMessage); err != nil {
		log.Println("Error on incoming MQTT message de-serialization: ", err)
		return
	}

	log.Printf("De-serialized payload of the incoming MQTT message: %+v\n", deserializedPayloadOfTheIncomingUpstreamMessage)

	performNumericKpiEvaluation(deserializedPayloadOfTheIncomingUpstreamMessage)
}

func runDemo() {
	log.Println("Running the Golang DEMO...")

	var err error

	relationalDatabaseClient = NewRelationalDatabaseClient()
	err = relationalDatabaseClient.ConnectToDatabase()
	if err != nil {
		log.Println("Cannot connect to the relational database: terminating the DEMO...")
		return
	}
	err = relationalDatabaseClient.InitializeDatabase()
	if err != nil {
		log.Println("Cannot initialize the relational database: terminating the DEMO...")
		return
	}

	mqttClient := NewEclipsePahoBasedAsynchronousMqttClient(mqttBrokerUri, mqttClientId, mqttBrokerUsername, mqttBrokerPassword)

	err = mqttClient.Connect()
	if err != nil {
		log.Println("Cannot connect to the MQTT broker: terminating the DEMO...")
		return
	}

	err = mqttClient.Subscribe(mqttTopic, MqttQosAtLeastOnce, handleIncomingMessage)
	if err != nil {
		log.Println("Cannot subscribe to the pre-defined MQTT topic: terminating the DEMO...")
		return
	}

	err = mqttClient.Publish(mqttTopic, MqttQosAtLeastOnce, "Hello from the Golang DEMO!")
	if err != nil {
		log.Println("Cannot publish a message to the pre-defined MQTT topic: terminating the DEMO...")
		return
	}
}
