package isc

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/rabbitmq"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedConstants"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedUtils"
)

func getQueueDeclarationErrorMessage(queueName string) string {
	return fmt.Sprintf("[ISC setup] Failed to declare the '%s' queue", queueName)
}

func SetupRabbitMQInfrastructureForISC() {
	sharedUtils.TerminateOnError(getRabbitMQClient().DeclareExchange(sharedConstants.MainFanoutExchangeName, rabbitmq.Fanout), fmt.Sprintf("[ISC setup] Failed to declare the %s exchange", sharedConstants.MainFanoutExchangeName))
	namesOfQueuesToDeclare := sharedUtils.SliceOf[string](sharedConstants.KPIFulfillmentCheckResultsQueueName, sharedConstants.KPIFulfillmentCheckRequestsQueueName, sharedConstants.SDInstanceRegistrationRequestsQueueName, sharedConstants.SetOfSDTypesUpdatesQueueName, sharedConstants.SetOfSDInstancesUpdatesQueueName)
	sharedUtils.ForEach(namesOfQueuesToDeclare, func(nameOfQueuesToDeclare string) {
		sharedUtils.TerminateOnError(getRabbitMQClient().DeclareQueue(nameOfQueuesToDeclare), getQueueDeclarationErrorMessage(nameOfQueuesToDeclare))
	})
}
