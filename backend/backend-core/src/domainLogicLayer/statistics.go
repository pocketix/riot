package domainLogicLayer

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/rabbitmq"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedConstants"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	amqp "github.com/rabbitmq/amqp091-go"
	"math/rand"
	"time"
)

func randomString(l int) string {
	rand.Seed(time.Now().UnixNano())
	bytes := make([]byte, l)
	for i := 0; i < l; i++ {
		bytes[i] = byte(randInt(65, 90))
	}
	return string(bytes)
}

func randInt(min int, max int) int {
	return min + rand.Intn(max-min)
}

func Query(input graphQLModel.StatisticsInput) sharedUtils.Result[[]graphQLModel.OutputData] {
	rabbitMQClient := getDLLRabbitMQClient()

	correlationId := randomString(32)

	var output sharedUtils.Result[[]graphQLModel.OutputData]

	err := rabbitmq.ConsumeJSONMessagesWithAccessToDelivery[[]graphQLModel.OutputData](rabbitMQClient, sharedConstants.TimeSeriesReadRequestQueueName, "", func(outputData []graphQLModel.OutputData, delivery amqp.Delivery) error {
		output = sharedUtils.NewSuccessResult[[]graphQLModel.OutputData](outputData)
		return nil
	})

	if err != nil {
		sharedUtils.NewFailureResult[graphQLModel.KPIDefinition](err)
	}

	err = rabbitMQClient.PublishJSONMessageRPC(sharedUtils.NewEmptyOptional[string](), sharedUtils.NewOptionalOf(sharedConstants.TimeSeriesReadRequestQueueName), sharedUtils.SerializeToJSON(input).GetPayload(), correlationId)

	if err != nil {
		sharedUtils.NewFailureResult[graphQLModel.KPIDefinition](err)
	}

	return output
}

func Save(input graphQLModel.InputData) sharedUtils.Result[bool] {
	rabbitMQClient := getDLLRabbitMQClient()
	rabbitMQClient.PublishJSONMessage(sharedUtils.NewOptionalOf(sharedConstants.TimeSeriesStoreDataQueueName), sharedUtils.NewOptionalOf(""), sharedUtils.SerializeToJSON(input).GetPayload())
	return sharedUtils.NewSuccessResult[bool](true)
}
