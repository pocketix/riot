package rabbitmq

import (
	"context"
	"fmt"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	amqp "github.com/rabbitmq/amqp091-go"
	"time"
)

const (
	mimeTypeOfJSONData      = "application/json"
	contextTimeoutInSeconds = 5
)

type Client interface {
	GetChannel() *amqp.Channel
	PublishJSONMessage(exchangeNameOptional sharedUtils.Optional[string], routingKeyOptional sharedUtils.Optional[string], messagePayload []byte) error
	DeclareQueue(queueName string) error
	DeclareExchange(exchangeName string, exchangeType ExchangeType) error
	SetupMessageConsumption(queueName string, messageConsumerFunction func(message amqp.Delivery) error) error
	Dispose()
}

type ClientImpl struct {
	connection *amqp.Connection
	channel    *amqp.Channel
}

func NewClient() Client {
	connection, err := amqp.Dial(sharedUtils.GetEnvironmentVariableValue("RABBITMQ_URL").GetPayloadOrDefault("amqp://guest:guest@rabbitmq:5672"))
	sharedUtils.TerminateOnError(err, "[RabbitMQ client] Failed to connect to RabbitMQ")
	channel, err := connection.Channel()
	sharedUtils.TerminateOnError(err, "[RabbitMQ client] Failed to open a channel")
	return &ClientImpl{connection: connection, channel: channel}
}

func (r *ClientImpl) GetChannel() *amqp.Channel {
	return r.channel
}

func (r *ClientImpl) PublishJSONMessage(exchangeNameOptional sharedUtils.Optional[string], routingKeyOptional sharedUtils.Optional[string], messagePayload []byte) error {
	ctx, cancelFunction := context.WithTimeout(context.Background(), contextTimeoutInSeconds*time.Second)
	defer cancelFunction()
	return r.channel.PublishWithContext(ctx, exchangeNameOptional.GetPayloadOrDefault(""), routingKeyOptional.GetPayloadOrDefault(""), false, false, amqp.Publishing{
		ContentType: mimeTypeOfJSONData,
		Body:        messagePayload,
	})
}

func (r *ClientImpl) DeclareQueue(queueName string) error {
	_, err := r.channel.QueueDeclare(queueName, false, false, false, false, nil)
	return err
}

type ExchangeType string

const (
	Direct  ExchangeType = "direct"
	Fanout  ExchangeType = "fanout"
	Topic   ExchangeType = "topic"
	Headers ExchangeType = "headers"
)

func (r *ClientImpl) DeclareExchange(exchangeName string, exchangeType ExchangeType) error {
	return r.channel.ExchangeDeclare(exchangeName, string(exchangeType), false, false, false, false, nil)
}

func (r *ClientImpl) SetupMessageConsumption(queueName string, messageConsumerFunction func(message amqp.Delivery) error) error {
	if err := r.channel.Qos(1, 0, false); err != nil {
		return err
	}
	messageChannel, err := r.channel.Consume(queueName, "", false, false, false, false, nil)
	if err != nil {
		return err
	}
	for message := range messageChannel {
		if err := messageConsumerFunction(message); err != nil {
			return err
		}
		if err := message.Ack(false); err != nil {
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
			return fmt.Errorf("incorrect message content type: %s", messageContentType)
		}
		jsonDeserializationResult := sharedUtils.DeserializeFromJSON[T](message.Body)
		if jsonDeserializationResult.IsFailure() {
			return jsonDeserializationResult.GetError()
		}
		return messagePayloadConsumerFunction(jsonDeserializationResult.GetPayload())
	})
}

func ConsumeJSONMessagesFromFanoutExchange[T any](c Client, fanoutExchangeName string, messagePayloadConsumerFunction func(messagePayload T) error) error {
	queue, err := c.GetChannel().QueueDeclare("", false, false, true, false, nil)
	if err != nil {
		return err
	}
	queueName := queue.Name
	if err := c.GetChannel().QueueBind(queueName, "", fanoutExchangeName, false, nil); err != nil {
		return err
	}
	return ConsumeJSONMessages[T](c, queueName, messagePayloadConsumerFunction)
}
