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

func checkKPIFulfillment(upstreamMessage UpstreamMessage) {

	device := upstreamMessage.Data.Devices[0] // TODO: Just one device? Or multiple? And how many?
	deviceType := device.DeviceType

	rootKPIDefinitionsForTheGivenDeviceType, err := relationalDatabaseClient.ObtainRootKPIDefinitionsForTheGivenDeviceType(deviceType)
	if err != nil {
		log.Printf("Could not load the KPI definitions for the device type '%s' from the database: cannot proceed with the KPI fulfillment check.\n", deviceType)
		return
	}

	log.Println("----- ----- ----- ----- ----- ----- ----- -----")
	for _, rootKPIDefinition := range rootKPIDefinitionsForTheGivenDeviceType {

		kpiFulfillmentStatusText := "Fulfilled"
		if !rootKPIDefinition.isFulfilled(device.DeviceParameters) {
			kpiFulfillmentStatusText = "Not fulfilled"
		}
		log.Printf("KPI: %s: %s\n", rootKPIDefinition.HumanReadableDescription, kpiFulfillmentStatusText)
	}
	log.Println("----- ----- ----- ----- ----- ----- ----- -----")
}

func handleIncomingMessage(_ mqtt.Client, incomingMessage mqtt.Message) {

	log.Println("Incoming MQTT message payload: ", string(incomingMessage.Payload()))

	var deserializedPayloadOfTheIncomingUpstreamMessage UpstreamMessage
	if err := json.Unmarshal(incomingMessage.Payload(), &deserializedPayloadOfTheIncomingUpstreamMessage); err != nil {
		log.Println("Error on incoming MQTT message de-serialization: ", err)
		return
	}

	log.Printf("De-serialized payload of the incoming MQTT message: %+v\n", deserializedPayloadOfTheIncomingUpstreamMessage)

	checkKPIFulfillment(deserializedPayloadOfTheIncomingUpstreamMessage)
}

func runDemo() {
	log.Println("Running the DEMO...")

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
