package isc

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedConstants"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func getQueueDeclarationErrorMessage(queueName string) string {
	return fmt.Sprintf("[ISC setup] Failed to declare the '%s' queue", queueName)
}

func SetupRabbitMQInfrastructureForISC() {
	namesOfQueuesToDeclare := util.SliceOf[string](sharedConstants.KPIDefinitionsBySDTypeDenotationMapUpdates, sharedConstants.KPIFulfillmentCheckResultsQueueName, sharedConstants.KPIFulfillmentCheckRequestsQueueName, sharedConstants.SDInstanceRegistrationRequestsQueueName, sharedConstants.SetOfSDTypesUpdatesQueueName, sharedConstants.SetOfSDInstancesUpdatesQueueName)
	util.ForEach(namesOfQueuesToDeclare, func(nameOfQueuesToDeclare string) {
		util.TerminateOnError(getRabbitMQClient().DeclareStandardQueue(nameOfQueuesToDeclare), getQueueDeclarationErrorMessage(nameOfQueuesToDeclare))
	})
}
