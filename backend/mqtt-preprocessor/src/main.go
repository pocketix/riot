package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-MQTT-preprocessor/src/mqtt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-MQTT-preprocessor/src/types"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/constants"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/rabbitmq"
	cTypes "github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/types"
	cUtil "github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
	amqp "github.com/rabbitmq/amqp091-go"
	"log"
	"sync"
	"time"
)

const (
	mqttBrokerURI      = "mqtt://localhost:1883"
	mqttClientID       = "bp-bures-SfPDfSD-MQTT-preprocessor"
	mqttTopic          = "topic"
	mqttBrokerUsername = "admin"
	mqttBrokerPassword = "password"
)

var (
	sdTypes              = cUtil.NewSet[string]()
	sdTypesMutex         sync.Mutex
	mqttMessageFIFO      = make([][]byte, 0)
	mqttMessageFIFOMutex sync.Mutex
)

func generateNewKPIFulfillmentCheckRequest(ctx context.Context, channel *amqp.Channel, messagePayload []byte) {
	errorMessage := "Failed to generate a new KPI fulfillment check request message"
	rabbitmq.EnqueueJSONMessage(ctx, channel, constants.KPIFulfillmentCheckRequestsQueueName, messagePayload, &errorMessage)
}

func checkForSetOfSDTypesUpdates(channel *amqp.Channel) {
	rabbitMQMessageChannel, err := channel.Consume(constants.SetOfSDTypesUpdatesQueueName, "", true, false, false, false, nil)
	cUtil.TerminateOnError(err, fmt.Sprintf("Failed to register a consumer: %s", err))
	for rabbitMQMessage := range rabbitMQMessageChannel {
		messageContentType := rabbitMQMessage.ContentType
		if messageContentType != constants.MIMETypeOfJSONData {
			log.Printf("Incorrect RabbitMQ message content type: %s", messageContentType)
			continue
		}
		var updatedSDTypesSlice []string
		if err := json.Unmarshal(rabbitMQMessage.Body, &updatedSDTypesSlice); err != nil {
			log.Printf("Failed to unmarshall a RabbitMQ message from the '%s' queue: it's not a JSON array of strings\n", constants.SetOfSDTypesUpdatesQueueName)
			continue
		}
		updatedSDTypes := cUtil.SliceToSet(updatedSDTypesSlice)
		sdTypesMutex.Lock()
		sdTypes = updatedSDTypes
		sdTypesMutex.Unlock()
	}
}

func processMQTTMessagePayload(ctx context.Context, channel *amqp.Channel, mqttMessagePayload []byte) {
	var deserializedPayloadOfTheMessage types.UpstreamMQTTMessageInJSONBasedProprietaryFormatOfLogimic
	err := json.Unmarshal(mqttMessagePayload, &deserializedPayloadOfTheMessage)
	cUtil.TerminateOnError(err, "Failed to unmarshall a MQTT message")
	sd := deserializedPayloadOfTheMessage.Data.SDArray[0]
	sdType := sd.Type
	sdTypesMutex.Lock()
	sdTypeOK := sdTypes.Contains(sdType)
	sdTypesMutex.Unlock()
	if !sdTypeOK {
		return
	}
	requestForKPIFulfillmentCheck := cTypes.RequestForKPIFulfillmentCheck{
		Timestamp: deserializedPayloadOfTheMessage.Notification.Timestamp,
		SD: cTypes.SDInfo{
			UID:  sd.UID,
			Type: sd.Type,
		},
		Parameters: sd.Parameters,
	}
	requestForKPIFulfillmentCheckMessagePayload, err := json.Marshal(requestForKPIFulfillmentCheck)
	cUtil.TerminateOnError(err, "Failed to marshall the request for KPI fulfillment check")
	generateNewKPIFulfillmentCheckRequest(ctx, channel, requestForKPIFulfillmentCheckMessagePayload)
}

func checkMQTTMessageFIFO(ctx context.Context, channel *amqp.Channel) {
	for {
		mqttMessageFIFOMutex.Lock()
		if len(mqttMessageFIFO) > 0 {
			mqttMessagePayload := mqttMessageFIFO[0]
			processMQTTMessagePayload(ctx, channel, mqttMessagePayload)
			mqttMessageFIFO = mqttMessageFIFO[1:]
			mqttMessageFIFOMutex.Unlock()
		} else {
			mqttMessageFIFOMutex.Unlock()
			time.Sleep(time.Millisecond * 100)
		}
	}
}

func addIncomingMQTTMessageToFIFO(incomingMessagePayload []byte) {
	mqttMessageFIFOMutex.Lock()
	mqttMessageFIFO = append(mqttMessageFIFO, incomingMessagePayload)
	mqttMessageFIFOMutex.Unlock()
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), constants.ContextTimeoutInSeconds*time.Second)
	connection, err := amqp.Dial(constants.URLOfRabbitMQ)
	cUtil.TerminateOnError(err, "Failed to connect to RabbitMQ")
	channel, err := connection.Channel()
	cUtil.TerminateOnError(err, "Failed to open a channel")
	var wg sync.WaitGroup
	wg.Add(2)
	go func() {
		defer wg.Done()
		checkForSetOfSDTypesUpdates(channel)
	}()
	mqttClient := mqtt.NewEclipsePahoBasedMqttClient(mqttBrokerURI, mqttClientID, mqttBrokerUsername, mqttBrokerPassword)
	cUtil.TerminateOnError(mqttClient.Connect(), fmt.Sprintf("Failed to connect to the MQTT broker [%s]", mqttBrokerURI))
	cUtil.TerminateOnError(mqttClient.Subscribe(mqttTopic, mqtt.QosAtLeastOnce, addIncomingMQTTMessageToFIFO), fmt.Sprintf("Failed to subscribe to the MQTT topic [%s]", mqttTopic))
	go func() {
		defer wg.Done()
		checkMQTTMessageFIFO(ctx, channel)
	}()
	wg.Wait()
	cUtil.TerminateOnError(channel.Close(), "Failed to close a channel")
	cUtil.TerminateOnError(connection.Close(), "Failed to close the connection to RabbitMQ")
	cancel()
}
