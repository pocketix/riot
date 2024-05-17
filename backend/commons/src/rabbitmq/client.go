package rabbitmq

import (
	"context"
	"errors"
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedUtils"
	amqp "github.com/rabbitmq/amqp091-go"
	"time"
)

const (
	mimeTypeOfJSONData      = "application/json"
	urlOfRabbitMQ           = "amqp://guest:guest@rabbitmq:5672/"
	contextTimeoutInSeconds = 5
)

type Client interface {
	EnqueueJSONMessage(queueName string, messagePayload []byte) error
	DeclareStandardQueue(queueName string) error
	SetupMessageConsumption(queueName string, messageConsumerFunction func(message amqp.Delivery) error) error
	Dispose()
}

type ClientImpl struct {
	connection *amqp.Connection
	channel    *amqp.Channel
}

func NewClient() Client {
	connection, err := amqp.Dial(urlOfRabbitMQ)
	sharedUtils.TerminateOnError(err, "[RabbitMQ client] Failed to connect to RabbitMQ")
	channel, err := connection.Channel()
	sharedUtils.TerminateOnError(err, "[RabbitMQ client] Failed to open a channel")
	return &ClientImpl{connection: connection, channel: channel}
}

func (r *ClientImpl) EnqueueJSONMessage(queueName string, messagePayload []byte) error {
	ctx, cancelFunction := context.WithTimeout(context.Background(), contextTimeoutInSeconds*time.Second)
	defer cancelFunction()
	return r.channel.PublishWithContext(ctx, "", queueName, false, false, amqp.Publishing{
		ContentType: mimeTypeOfJSONData,
		Body:        messagePayload,
	})
}

func (r *ClientImpl) DeclareStandardQueue(queueName string) error {
	_, err := r.channel.QueueDeclare(queueName, false, false, false, false, nil)
	return err
}

func (r *ClientImpl) SetupMessageConsumption(queueName string, messageConsumerFunction func(message amqp.Delivery) error) error {
	messages, err := r.channel.Consume(queueName, "", true, false, false, false, nil)
	if err != nil {
		return err
	}
	for message := range messages {
		err = messageConsumerFunction(message)
		if err != nil {
			return err
		}
	}
	return nil
}

func (r *ClientImpl) Dispose() {
	sharedUtils.LogPossibleErrorThenProceed(r.channel.Close(), "Failed to close a channel")
	sharedUtils.TerminateOnError(r.connection.Close(), "Failed to close the connection to RabbitMQ")
}

func ConsumeJSONMessages[T any](c Client, queueName string, messagePayloadConsumerFunction func(messagePayload T) error) error {
	return c.SetupMessageConsumption(queueName, func(message amqp.Delivery) error {
		messageContentType := message.ContentType
		if messageContentType != mimeTypeOfJSONData {
			return errors.New(fmt.Sprintf("Incorrect message content type: %s", messageContentType))
		}
		jsonDeserializationResult := sharedUtils.DeserializeFromJSON[T](message.Body)
		if jsonDeserializationResult.IsFailure() {
			return jsonDeserializationResult.GetError()
		}
		return messagePayloadConsumerFunction(jsonDeserializationResult.GetPayload())
	})
}
