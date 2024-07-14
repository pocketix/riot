package isc

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/rabbitmq"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedConstants"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

func consumeMessageProcessingUnitConnectionNotificationJSONMessages(messageProcessingUnitConnectionNotificationConsumerFunction func(messageProcessingUnitConnectionNotification sharedModel.MessageProcessingUnitConnectionNotification) error, rabbitMQClient rabbitmq.Client) {
	err := rabbitmq.ConsumeJSONMessages[sharedModel.MessageProcessingUnitConnectionNotification](rabbitMQClient, sharedConstants.MessageProcessingUnitConnectionNotificationsQueueName, messageProcessingUnitConnectionNotificationConsumerFunction)
	errorMessage := fmt.Sprintf("[ISC] Consumption of messages from the '%s' queue has failed", sharedConstants.MessageProcessingUnitConnectionNotificationsQueueName)
	sharedUtils.TerminateOnError(err, errorMessage)
}

func consumeSDInstanceRegistrationRequestJSONMessages(sdInstanceRegistrationRequestConsumerFunction func(sdInstanceRegistrationRequest sharedModel.SDInstanceRegistrationRequestISCMessage) error, rabbitMQClient rabbitmq.Client) {
	err := rabbitmq.ConsumeJSONMessages[sharedModel.SDInstanceRegistrationRequestISCMessage](rabbitMQClient, sharedConstants.SDInstanceRegistrationRequestsQueueName, sdInstanceRegistrationRequestConsumerFunction)
	errorMessage := fmt.Sprintf("[ISC] Consumption of messages from the '%s' queue has failed", sharedConstants.SDInstanceRegistrationRequestsQueueName)
	sharedUtils.TerminateOnError(err, errorMessage)
}

func consumeKPIFulfillmentCheckResultJSONMessages(kpiFulfillmentCheckResultConsumerFunction func(kpiFulfillmentCheckResultTuple sharedModel.KPIFulfillmentCheckResultTupleISCMessage) error, rabbitMQClient rabbitmq.Client) {
	err := rabbitmq.ConsumeJSONMessages[sharedModel.KPIFulfillmentCheckResultTupleISCMessage](rabbitMQClient, sharedConstants.KPIFulfillmentCheckResultsQueueName, kpiFulfillmentCheckResultConsumerFunction)
	errorMessage := fmt.Sprintf("[ISC] Consumption of messages from the '%s' queue has failed", sharedConstants.KPIFulfillmentCheckResultsQueueName)
	sharedUtils.TerminateOnError(err, errorMessage)
}
