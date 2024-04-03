package rabbitmq

import (
	"errors"
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/constants"
	cUtil "github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
	amqp "github.com/rabbitmq/amqp091-go"
)

func ConsumeJSONMessages[T any](r Client, queueName string, messagePayloadConsumerFunction func(messagePayload T) error) error {
	return r.SetupMessageConsumption(queueName, func(message amqp.Delivery) error {
		messageContentType := message.ContentType
		if messageContentType != constants.MIMETypeOfJSONData {
			return errors.New(fmt.Sprintf("Incorrect message content type: %s", messageContentType))
		}
		jsonDeserializationResult := cUtil.DeserializeFromJSON[T](message.Body)
		if jsonDeserializationResult.IsFailure() {
			return jsonDeserializationResult.GetError()
		}
		return messagePayloadConsumerFunction(jsonDeserializationResult.GetPayload())
	})
}
