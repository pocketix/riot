package isc

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/constants"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/rabbitmq"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/types"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
	"log"
)

func consumeSDInstanceRegistrationRequestJSONMessages(sdInstanceRegistrationRequestConsumerFunction func(sdInstanceRegistrationRequest types.RequestForSDInstanceRegistration) error) {
	err := rabbitmq.ConsumeJSONMessages[types.RequestForSDInstanceRegistration](getRabbitMQClient(), constants.SDInstanceRegistrationRequestsQueueName, sdInstanceRegistrationRequestConsumerFunction)
	errorMessage := fmt.Sprintf("[ISC] Consumption of messages from the '%s' queue has failed", constants.SDInstanceRegistrationRequestsQueueName)
	util.TerminateOnError(err, errorMessage)
}

func consumeKPIFulfillmentCheckResultJSONMessages(kpiFulfillmentCheckResultConsumerFunction func(kpiFulfillmentCheckResult types.KPIFulfillmentCheckResultInfo) error) {
	if err := rabbitmq.ConsumeJSONMessages[types.KPIFulfillmentCheckResultInfo](getRabbitMQClient(), constants.KPIFulfillmentCheckResultsQueueName, kpiFulfillmentCheckResultConsumerFunction); err != nil {
		log.Printf("[ISC] Consumption of messages from the '%s' queue has failed: %s", constants.KPIFulfillmentCheckResultsQueueName, err.Error())
	}
}
