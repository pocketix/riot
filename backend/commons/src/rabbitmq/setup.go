package rabbitmq

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/constants"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func SetupRabbitMQ() {
	getQueueDeclarationErrorMessage := func(queueName string) string {
		return fmt.Sprintf("[RabbitMQ setup] Failed to declare the '%s' queue", queueName)
	}
	client := NewClient()
	util.TerminateOnError(client.DeclareStandardQueue(constants.KPIFulfillmentCheckRequestsQueueName), getQueueDeclarationErrorMessage(constants.KPIFulfillmentCheckRequestsQueueName))
	util.TerminateOnError(client.DeclareStandardQueue(constants.SDInstanceRegistrationRequestsQueueName), getQueueDeclarationErrorMessage(constants.SDInstanceRegistrationRequestsQueueName))
	util.TerminateOnError(client.DeclareStandardQueue(constants.SetOfSDTypesUpdatesQueueName), getQueueDeclarationErrorMessage(constants.SetOfSDTypesUpdatesQueueName))
	util.TerminateOnError(client.DeclareStandardQueue(constants.SetOfSDInstancesUpdatesQueueName), getQueueDeclarationErrorMessage(constants.SetOfSDInstancesUpdatesQueueName))
	client.Dispose()
}
