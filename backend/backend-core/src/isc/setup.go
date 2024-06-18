package isc

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/rabbitmq"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedConstants"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

func getQueueDeclarationErrorMessage(queueName string) string {
	return fmt.Sprintf("[ISC setup] Failed to declare the '%s' queue", queueName)
}

func SetupRabbitMQInfrastructureForISC(rabbitMQClient rabbitmq.Client) {
	sharedUtils.TerminateOnError(rabbitMQClient.DeclareExchange(sharedConstants.MainFanoutExchangeName, rabbitmq.Fanout), fmt.Sprintf("[ISC setup] Failed to declare the %s exchange", sharedConstants.MainFanoutExchangeName))
	namesOfQueuesToDeclare := sharedUtils.SliceOf[string](sharedConstants.KPIFulfillmentCheckResultsQueueName, sharedConstants.KPIFulfillmentCheckRequestsQueueName, sharedConstants.SDInstanceRegistrationRequestsQueueName, sharedConstants.SetOfSDTypesUpdatesQueueName, sharedConstants.SetOfSDInstancesUpdatesQueueName, sharedConstants.MessageProcessingUnitConnectionNotificationsQueue)
	sharedUtils.ForEach(namesOfQueuesToDeclare, func(nameOfQueuesToDeclare string) {
		sharedUtils.TerminateOnError(rabbitMQClient.DeclareQueue(nameOfQueuesToDeclare), getQueueDeclarationErrorMessage(nameOfQueuesToDeclare))
	})
}
