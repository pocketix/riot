package isc

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/rabbitmq"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedConstants"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedUtils"
	"log"
)

func consumeSDInstanceRegistrationRequestJSONMessages(sdInstanceRegistrationRequestConsumerFunction func(sdInstanceRegistrationRequest sharedModel.SDInstanceRegistrationRequestISCMessage) error) {
	err := rabbitmq.ConsumeJSONMessages[sharedModel.SDInstanceRegistrationRequestISCMessage](getRabbitMQClient(), sharedConstants.SDInstanceRegistrationRequestsQueueName, sdInstanceRegistrationRequestConsumerFunction)
	errorMessage := fmt.Sprintf("[ISC] Consumption of messages from the '%s' queue has failed", sharedConstants.SDInstanceRegistrationRequestsQueueName)
	sharedUtils.TerminateOnError(err, errorMessage)
}

func consumeKPIFulfillmentCheckResultJSONMessages(kpiFulfillmentCheckResultConsumerFunction func(kpiFulfillmentCheckResult sharedModel.KPIFulfillmentCheckResultISCMessage) error) {
	if err := rabbitmq.ConsumeJSONMessages[sharedModel.KPIFulfillmentCheckResultISCMessage](getRabbitMQClient(), sharedConstants.KPIFulfillmentCheckResultsQueueName, kpiFulfillmentCheckResultConsumerFunction); err != nil {
		log.Printf("[ISC] Consumption of messages from the '%s' queue has failed: %s", sharedConstants.KPIFulfillmentCheckResultsQueueName, err.Error())
	}
}
