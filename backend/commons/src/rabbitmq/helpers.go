package rabbitmq

import (
	"context"
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/constants"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
	amqp "github.com/rabbitmq/amqp091-go"
)

func DeclareStandardRabbitMQQueue(channel *amqp.Channel, queueName string) amqp.Queue {
	queue, err := channel.QueueDeclare(queueName, false, false, false, false, nil)
	util.TerminateOnError(err, fmt.Sprintf("Failed to declare the '%s' RabbitMQ queue", queueName))
	return queue
}

func EnqueueJSONMessage(ctx context.Context, channel *amqp.Channel, queueName string, messagePayload []byte, customErrorMessage *string) {
	err := channel.PublishWithContext(ctx, "", queueName, false, false, amqp.Publishing{
		ContentType: constants.MIMETypeOfJSONData,
		Body:        messagePayload,
	})
	errorMessage := "Failed to enqueue a JSON message."
	if customErrorMessage != nil {
		errorMessage = *customErrorMessage
	}
	util.TerminateOnError(err, errorMessage)
}
