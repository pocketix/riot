package rabbitmq

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/constants"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
	amqp "github.com/rabbitmq/amqp091-go"
)

func SetupRabbitMQ() {
	connection, err := amqp.Dial(constants.URLOfRabbitMQ)
	util.TerminateOnError(err, "Failed to connect to RabbitMQ")
	channel, err := connection.Channel()
	util.TerminateOnError(err, "Failed to open a channel")
	DeclareStandardRabbitMQQueue(channel, constants.KPIFulfillmentCheckRequestsQueueName)
	DeclareStandardRabbitMQQueue(channel, constants.SDInstanceRegistrationRequestsQueueName)
	DeclareStandardRabbitMQQueue(channel, constants.SetOfSDTypesUpdatesQueueName)
}
