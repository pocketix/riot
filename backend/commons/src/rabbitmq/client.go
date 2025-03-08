package rabbitmq

import (
	"context"
	"fmt"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	amqp "github.com/rabbitmq/amqp091-go"
	"log"
	"strconv"
	"sync"
	"time"
)

type connectionManager struct {
	conn        *amqp.Connection
	mu          sync.Mutex
	clientCount int
	url         string
}

var (
	connectionManagerInstance *connectionManager = nil
	once                      sync.Once
)

func getConnectionManagerInstance() *connectionManager {
	once.Do(func() {
		urlOptional := sharedUtils.GetEnvironmentVariableValue("RABBITMQ_URL")
		connectionManagerInstance = &connectionManager{
			url: urlOptional.GetPayloadOrDefault("amqp://guest:guest@rabbitmq:5672"),
		}
	})
	return connectionManagerInstance
}

func (c *connectionManager) connect() {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.conn == nil || c.conn.IsClosed() {
		conn, err := amqp.Dial(c.url)
		sharedUtils.TerminateOnError(err, "[RabbitMQ client] Failed to connect to RabbitMQ")
		c.conn = conn
	}
	c.clientCount++
}

func (c *connectionManager) release() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.clientCount--
	if c.clientCount == 0 && c.conn != nil {
		sharedUtils.LogPossibleErrorThenProceed(c.conn.Close(), "[RabbitMQ client] Failed to close RabbitMQ connection")
		c.conn = nil
	}
}

type Client interface {
	GetChannel() *amqp.Channel
	PublishJSONMessage(exchangeNameOptional sharedUtils.Optional[string], routingKeyOptional sharedUtils.Optional[string], messagePayload []byte) error
	PublishJSONMessageRPC(exchangeNameOptional sharedUtils.Optional[string], routingKeyOptional sharedUtils.Optional[string], messagePayload []byte, correlationId string, replyTo sharedUtils.Optional[string]) error
	DeclareQueue(queueName string) error
	SetupMessageConsumption(queueName string, messageConsumerFunction func(message amqp.Delivery) error) error
	SetupMessageConsumptionWithCorrelationId(queueName string, correlationId string, messageConsumerFunction func(message amqp.Delivery) error) error
	Dispose()
}

type ClientImpl struct {
	channel *amqp.Channel
}

func NewClient() Client {
	cm := getConnectionManagerInstance()
	cm.connect()
	channel, err := cm.conn.Channel()
	sharedUtils.TerminateOnError(err, "[RabbitMQ client] Failed to open a channel")
	return &ClientImpl{channel: channel}
}

func (c *ClientImpl) GetChannel() *amqp.Channel {
	return c.channel
}

func (c *ClientImpl) PublishJSONMessage(exchangeNameOptional sharedUtils.Optional[string], routingKeyOptional sharedUtils.Optional[string], messagePayload []byte) error {
	ctx, cancelFunction := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancelFunction()
	exchangeName := exchangeNameOptional.GetPayloadOrDefault("")
	routingKey := routingKeyOptional.GetPayloadOrDefault("")
	return c.channel.PublishWithContext(ctx, exchangeName, routingKey, false, false, amqp.Publishing{
		ContentType: "application/json",
		Body:        messagePayload,
	})
}

func (c *ClientImpl) PublishJSONMessageRPC(exchangeNameOptional sharedUtils.Optional[string], routingKeyOptional sharedUtils.Optional[string], messagePayload []byte, correlationId string, replyToOptional sharedUtils.Optional[string]) error {
	timeout := 10 * time.Second
	ctx, cancelFunction := context.WithTimeout(context.Background(), timeout)
	expiration := strconv.Itoa(int(timeout / time.Millisecond))
	defer cancelFunction()
	exchangeName := exchangeNameOptional.GetPayloadOrDefault("")
	routingKey := routingKeyOptional.GetPayloadOrDefault("")
	replyTo := replyToOptional.GetPayloadOrDefault("")

	return c.channel.PublishWithContext(ctx, exchangeName, routingKey, false, false, amqp.Publishing{
		ContentType:   "application/json",
		Body:          messagePayload,
		CorrelationId: correlationId,
		ReplyTo:       replyTo,
		Expiration:    expiration,
	})
}

func (c *ClientImpl) DeclareQueue(queueName string) error {
	_, err := c.channel.QueueDeclare(queueName, false, false, false, false, nil)
	return err
}

func (c *ClientImpl) SetupMessageConsumption(queueName string, messageConsumerFunction func(message amqp.Delivery) error) error {
	if err := c.channel.Qos(1, 0, false); err != nil {
		return err
	}
	messageChannel, err := c.channel.Consume(queueName, "", false, false, false, false, nil)
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

func (c *ClientImpl) SetupMessageConsumptionWithCorrelationId(queueName string, correlationId string, messageConsumerFunction func(message amqp.Delivery) error) error {
	consumerName := fmt.Sprintf("%s-consumer", correlationId)
	if err := c.channel.Qos(1, 0, false); err != nil {
		return err
	}

	messageChannel, err := c.channel.Consume(queueName, consumerName, false, false, false, false, nil)
	if err != nil {
		log.Printf("SetupMessageConsumptionWithCorrelationId | %s", err)
		return err
	}

	// Timeout after a time, so you don't ping-pong with a request. Most likely the API won't even care after this time
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	for {
		select {
		case message, ok := <-messageChannel:
			if !ok {
				return fmt.Errorf("SetupMessageConsumptionWithCorrelationId | Message channel closed")
			}

			log.Printf("SetupMessageConsumptionWithCorrelationId | Seeing message correlationId %s from a consumer %s\n", message.CorrelationId, consumerName)

			if message.CorrelationId != correlationId {
				// Return the message back to the queue if it has a wrong correlation ID
				if err := message.Nack(false, true); err != nil {
					log.Printf("SetupMessageConsumptionWithCorrelationId | %s", err)
					return err
				}
				continue
			}

			if err := message.Ack(false); err != nil {
				log.Printf("SetupMessageConsumptionWithCorrelationId | %s", err)
				return err
			}

			err := c.channel.Cancel(consumerName, true)
			if err != nil {
				log.Printf("SetupMessageConsumptionWithCorrelationId | %s", err)
				return err
			}

			if err := messageConsumerFunction(message); err != nil {
				log.Printf("SetupMessageConsumptionWithCorrelationId | %s", err)
				return err
			}

			log.Println("SetupMessageConsumptionWithCorrelationId | Consuming message and closing channel")

			err = c.channel.Cancel(consumerName, true) // Stop consuming
			if err != nil {
				log.Printf("SetupMessageConsumptionWithCorrelationId | %s", err)
				return err
			}

			log.Println("SetupMessageConsumptionWithCorrelationId | Closed channel, exiting")

			return nil // Exit after processing

		case <-ctx.Done():
			log.Println("SetupMessageConsumptionWithCorrelationId | Timeout reached. Stopping message consumption.")
			err := c.channel.Cancel(consumerName, true) // Stop consuming
			if err != nil {
				log.Printf("SetupMessageConsumptionWithCorrelationId | %s", err)
				return err
			}
			return fmt.Errorf("SetupMessageConsumptionWithCorrelationId | message consumption timed out after 100 seconds")
		}
	}
}

func (c *ClientImpl) Dispose() {
	sharedUtils.LogPossibleErrorThenProceed(c.channel.Close(), "[RabbitMQ client] Failed to close a channel")
	getConnectionManagerInstance().release()
}

func ConsumeJSONMessages[T any](client Client, queueName string, messagePayloadConsumerFunction func(messagePayload T) error) error {
	return client.SetupMessageConsumption(queueName, func(message amqp.Delivery) error {
		messageContentType := message.ContentType
		if messageContentType != "application/json" {
			return fmt.Errorf("incorrect message content type: %s", messageContentType)
		}
		jsonDeserializationResult := sharedUtils.DeserializeFromJSON[T](message.Body)
		if jsonDeserializationResult.IsFailure() {
			return jsonDeserializationResult.GetError()
		}
		return messagePayloadConsumerFunction(jsonDeserializationResult.GetPayload())
	})
}

func ConsumeJSONMessagesWithAccessToDelivery[T any](client Client, queueName string, correlationId string, messagePayloadConsumerFunction func(messagePayload T, delivery amqp.Delivery) error) error {
	messageConsumerFunction := func(message amqp.Delivery) error {
		messageContentType := message.ContentType
		if messageContentType != "application/json" {
			return fmt.Errorf("incorrect message content type: %s", messageContentType)
		}

		jsonDeserializationResult := sharedUtils.DeserializeFromJSON[T](message.Body)
		if jsonDeserializationResult.IsFailure() {
			fmt.Println(jsonDeserializationResult.GetError())
			return jsonDeserializationResult.GetError()
		}
		return messagePayloadConsumerFunction(jsonDeserializationResult.GetPayload(), message)
	}

	if correlationId == "" {
		return client.SetupMessageConsumption(queueName, messageConsumerFunction)
	} else {
		return client.SetupMessageConsumptionWithCorrelationId(queueName, correlationId, messageConsumerFunction)
	}
}

func ConsumeJSONMessagesFromFanoutExchange[T any](client Client, fanoutExchangeName string, messagePayloadConsumerFunction func(messagePayload T) error) error {
	queue, err := client.GetChannel().QueueDeclare("", false, false, true, false, nil)
	if err != nil {
		return err
	}
	queueName := queue.Name
	if err := client.GetChannel().QueueBind(queueName, "", fanoutExchangeName, false, nil); err != nil {
		return err
	}
	return ConsumeJSONMessages[T](client, queueName, messagePayloadConsumerFunction)
}
