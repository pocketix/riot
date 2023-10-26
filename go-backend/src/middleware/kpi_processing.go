package middleware

import (
	"bp-bures-SfPDfSD/src/dto"
	"bp-bures-SfPDfSD/src/mqtt"
	"bp-bures-SfPDfSD/src/persistence/relational-database"
	"encoding/json"
	"log"
)

const (
	mqttBrokerUri      = "mqtt://localhost:1883"
	mqttClientId       = "go-mqtt-client-test"
	mqttTopic          = "demo/eclipse-paho-go-client"
	mqttBrokerUsername = "admin"
	mqttBrokerPassword = "password"
)

func checkKPIFulfillment(upstreamMessage dto.Dev5UpstreamMessageDTO) {

	device := upstreamMessage.Data.Devices[0] // TODO: Just one device? Or multiple? And how many?
	deviceType := device.DeviceType

	relationalDatabaseClient, err := relational_database.GetRelationalDatabaseClient()
	if err != nil {
		log.Println("Error occurred while trying to obtain the relational-database client: cannot proceed with the KPI fulfillment check.")
		return
	}

	rootKPIDefinitionsForTheGivenDeviceType, err := relationalDatabaseClient.ObtainKPIDefinitionsForTheGivenDeviceType(deviceType)
	if err != nil {
		log.Printf("Could not load the KPI definitions for the device type '%s' from the relational-database: cannot proceed with the KPI fulfillment check.\n", deviceType)
		return
	}

	log.Println("----- ----- ----- ----- ----- ----- ----- -----")
	for _, rootKPIDefinition := range rootKPIDefinitionsForTheGivenDeviceType {

		kpiFulfillmentStatusText := "Fulfilled"
		if !CheckKPIFulfillment(rootKPIDefinition, &device.DeviceParameters) {
			kpiFulfillmentStatusText = "Not fulfilled"
		}
		log.Printf("KPI: %s: %s\n", rootKPIDefinition.HumanReadableDescription, kpiFulfillmentStatusText)
	}
	log.Println("----- ----- ----- ----- ----- ----- ----- -----")
}

func handleIncomingMessage(incomingMessagePayload []byte) {

	log.Println("Incoming MQTT message payload: ", string(incomingMessagePayload))

	var deserializedPayloadOfTheIncomingUpstreamMessage dto.Dev5UpstreamMessageDTO
	if err := json.Unmarshal(incomingMessagePayload, &deserializedPayloadOfTheIncomingUpstreamMessage); err != nil {
		log.Println("Error on incoming MQTT message de-serialization: ", err)
		return
	}

	log.Printf("De-serialized payload of the incoming MQTT message: %+v\n", deserializedPayloadOfTheIncomingUpstreamMessage)

	checkKPIFulfillment(deserializedPayloadOfTheIncomingUpstreamMessage)
}

func StartProcessingKPIs() {

	log.Println("Starting to process KPIs...")

	var err error

	mqttClient := mqtt.NewEclipsePahoBasedMqttClient(mqttBrokerUri, mqttClientId, mqttBrokerUsername, mqttBrokerPassword)

	err = mqttClient.Connect()
	if err != nil {
		log.Println("Cannot connect to the MQTT broker: terminating...")
		return
	}

	err = mqttClient.Subscribe(mqttTopic, mqtt.QosAtLeastOnce, handleIncomingMessage)
	if err != nil {
		log.Println("Cannot subscribe to the pre-defined MQTT topic: terminating...")
		return
	}
}
