package middleware

import (
	"bp-bures-SfPDfSD/src/dto"
	"bp-bures-SfPDfSD/src/mqtt"
	"bp-bures-SfPDfSD/src/persistence/rdb"
	"encoding/json"
	"github.com/thoas/go-funk"
	"log"
	"os"
	"sync"
	"time"
)

const (
	mqttBrokerUri      = "mqtt://localhost:1883"
	mqttClientId       = "go-mqtt-client-test"
	mqttTopic          = "demo/eclipse-paho-go-client"
	mqttBrokerUsername = "admin"
	mqttBrokerPassword = "password"
)

var (
	mqttMessageQueue      = make([][]byte, 0)
	mqttMessageQueueMutex = &sync.Mutex{}
)

func checkKPIFulfillment(deviceData dto.Dev5DeviceDTO) { // TODO: Implement KPI evaluations per device and save these to database...

	deviceType := deviceData.DeviceType

	kpiDefinitions, err := (*rdb.GetRelationalDatabaseClientReference()).ObtainKPIDefinitionsForTheGivenDeviceType(deviceType)
	if err != nil {
		log.Printf("Could not load the KPI definitions for the device type '%s' from the rdb: cannot proceed with the KPI fulfillment check.\n", deviceType)
		return
	}

	log.Println("----- ----- ----- ----- ----- ----- ----- -----")
	for _, kpiDefinition := range kpiDefinitions {

		kpiFulfillmentStatusText := "Fulfilled"
		if !CheckKPIFulfillment(kpiDefinition, &deviceData.DeviceParameters) {
			kpiFulfillmentStatusText = "Not fulfilled"
		}
		log.Printf("KPI: %s: %s\n", kpiDefinition.HumanReadableDescription, kpiFulfillmentStatusText)
	}
	log.Println("----- ----- ----- ----- ----- ----- ----- -----")
}

func registerDeviceIfNotAlreadyPresent(deviceData dto.Dev5DeviceDTO, deviceTypeDTOReference *dto.DeviceTypeDTO) error {

	currentlyPresentDevices, err := (*rdb.GetRelationalDatabaseClientReference()).ObtainAllDevices()
	if err != nil {
		return err
	}

	if funk.Contains(currentlyPresentDevices, func(d dto.DeviceDTO) bool { return d.UID == deviceData.DeviceUID }) {
		log.Println("The device is already present... no need to register it...")
		return nil
	}

	newDeviceDTO := dto.DeviceDTO{
		UID:        deviceData.DeviceUID,
		Name:       deviceData.DeviceUID,
		DeviceType: deviceTypeDTOReference,
	}

	_, err = (*rdb.GetRelationalDatabaseClientReference()).InsertDevice(newDeviceDTO)
	return err
}

func compareDeviceTypeAgainstTrackedTypes(incomingMessageDeviceType string) (bool, *dto.DeviceTypeDTO, error) {

	deviceTypeDTOs, err := (*rdb.GetRelationalDatabaseClientReference()).ObtainAllDeviceTypes()
	if err != nil {
		return false, nil, err
	}

	res := funk.Find(deviceTypeDTOs, func(u dto.DeviceTypeDTO) bool { return u.Denotation == incomingMessageDeviceType })
	if res == nil {
		return false, nil, nil
	}

	deviceTypeDTO := res.(dto.DeviceTypeDTO)

	return true, &deviceTypeDTO, nil
}

func processIncomingMQTTMessagePayload(incomingMessagePayload []byte) {

	log.Printf("Incoming MQTT message payload: %s\n", string(incomingMessagePayload))

	var deserializedPayloadOfTheIncomingUpstreamMessage dto.Dev5UpstreamMessageDTO
	if err := json.Unmarshal(incomingMessagePayload, &deserializedPayloadOfTheIncomingUpstreamMessage); err != nil {
		log.Printf("Error occurred while de-serializing the payload of the incoming MQTT message: %v\n", err)
		return
	}

	log.Printf("De-serialized payload of the incoming MQTT message: %+v\n", deserializedPayloadOfTheIncomingUpstreamMessage)

	deviceData := deserializedPayloadOfTheIncomingUpstreamMessage.Data.Devices[0]

	isDeviceTypeAmongTrackedDeviceTypes, deviceTypeDTOReference, err := compareDeviceTypeAgainstTrackedTypes(deviceData.DeviceType)
	if err != nil {
		log.Printf("Error occurred while processing the payload of the MQTT message (compareDeviceTypeAgainstTrackedTypes): %v\n", err)
		log.Println("No more processing of this MQTT message's payload...")
		return
	}

	if !isDeviceTypeAmongTrackedDeviceTypes {
		log.Println("The device type is not among the tracked device types...")
		log.Println("No more processing of this MQTT message's payload...")
		return
	}

	if err := registerDeviceIfNotAlreadyPresent(deviceData, deviceTypeDTOReference); err != nil {
		log.Printf("Error occurred while processing the payload of the MQTT message (registerDeviceIfNotAlreadyPresent): %v\n", err)
		log.Println("No more processing of this MQTT message's payload...")
	}

	checkKPIFulfillment(deviceData)
}

func checkMQTTMessageQueue() {

	for {
		mqttMessageQueueMutex.Lock()
		if len(mqttMessageQueue) > 0 {
			incomingMessagePayload := mqttMessageQueue[0]
			processIncomingMQTTMessagePayload(incomingMessagePayload)
			mqttMessageQueue = mqttMessageQueue[1:]
			mqttMessageQueueMutex.Unlock()
		} else {
			mqttMessageQueueMutex.Unlock()
			time.Sleep(time.Millisecond * 100)
		}
	}
}

func registerIncomingMQTTMessagePayloadForProcessing(incomingMessagePayload []byte) {

	mqttMessageQueueMutex.Lock()
	mqttMessageQueue = append(mqttMessageQueue, incomingMessagePayload)
	mqttMessageQueueMutex.Unlock()
}

func StartProcessingIncomingMQTTCommunication() {

	log.Println("Starting to process incoming MQTT communication...")

	mqttClient := mqtt.NewEclipsePahoBasedMqttClient(mqttBrokerUri, mqttClientId, mqttBrokerUsername, mqttBrokerPassword)

	if err := mqttClient.Connect(); err != nil {
		log.Printf("Cannot connect to the MQTT broker [%s]: terminating...\n", mqttBrokerUri)
		os.Exit(1)
	}

	if err := mqttClient.Subscribe(mqttTopic, mqtt.QosAtLeastOnce, registerIncomingMQTTMessagePayloadForProcessing); err != nil {
		log.Printf("Cannot subscribe to the MQTT topic [%s]: terminating...\n", mqttTopic)
		os.Exit(1)
	}

	go checkMQTTMessageQueue()
}
