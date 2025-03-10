package main

import (
	"encoding/json"
	"fmt"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/rabbitmq"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedConstants"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/xjohnp00/jiap/backend/shared/time-series-store/src/internal"
	"log"
	"os"
)

func main() {
	hasError, environment := parseParameters()

	if hasError {
		os.Exit(1)
	}

	fmt.Println("Time Series Store Starting")

	influx, influxErrors, _ := internal.NewInflux2Client(environment.InfluxUrl, environment.InfluxToken, environment.InfluxOrg, environment.InfluxBucket)

	rabbitMQClient := rabbitmq.NewClient()
	defer rabbitMQClient.Dispose()
	defer influx.Close()

	fmt.Println("Time Series Store Ready")

	sharedUtils.WaitForAll(
		func() {
			err := consumeInputMessages(rabbitMQClient, influx)

			if err != nil {
				fmt.Println(err.Error())
			}
		},
		func() {
			err := consumeReadRequests(rabbitMQClient, influx)

			if err != nil {
				fmt.Println(err.Error())
			}
		},
	)

	go func() {
		for err := range influxErrors {
			fmt.Println(err)
		}
	}()
}

func consumeInputMessages(rabbitMQClient rabbitmq.Client, influx internal.Influx2Client) error {
	err := rabbitmq.ConsumeJSONMessages[sharedModel.InputData](rabbitMQClient, sharedConstants.TimeSeriesStoreDataQueueName, func(messagePayload sharedModel.InputData) error {
		influx.Write(messagePayload)
		return nil
	})
	return err
}

func consumeReadRequests(rabbitMQClient rabbitmq.Client, influx internal.Influx2Client) error {
	err := rabbitmq.ConsumeJSONMessagesWithAccessToDelivery[sharedModel.ReadRequestBody](
		rabbitMQClient,
		sharedConstants.TimeSeriesReadRequestQueueName,
		"",
		func(readRequestBody sharedModel.ReadRequestBody, delivery amqp.Delivery) error {
			result := influx.Query(readRequestBody)

			if result.IsFailure() {
				fmt.Println(result.GetError())
			}

			responseWithData := sharedModel.ReadRequestResponseOrError{
				Data:  nil,
				Error: "",
			}

			if result.IsSuccess() {
				responseWithData.Data = result.GetPayload()
			}

			if result.IsFailure() {
				responseWithData.Error = result.GetError().Error()
			}

			jsonData, err := json.Marshal(responseWithData)

			if err != nil {
				log.Printf("Error During Marshall: %s", err)
			}

			err = rabbitMQClient.PublishJSONMessageRPC(
				sharedUtils.NewEmptyOptional[string](),
				sharedUtils.NewOptionalOf(delivery.ReplyTo),
				jsonData,
				delivery.CorrelationId,
				sharedUtils.NewEmptyOptional[string](),
			)

			if err != nil {
				log.Fatalf("Error: %s", err)
				return err
			}
			return nil
		},
	)
	return err
}

func parseParameters() (bool, internal.TimeSeriesStoreEnvironment) {
	token := sharedUtils.GetEnvironmentVariableValue("INFLUX_TOKEN")
	url := sharedUtils.GetEnvironmentVariableValue("INFLUX_URL")
	org := sharedUtils.GetEnvironmentVariableValue("INFLUX_ORGANIZATION")
	bucket := sharedUtils.GetEnvironmentVariableValue("INFLUX_BUCKET")
	ampqUrl := sharedUtils.GetEnvironmentVariableValue("RABBITMQ_URL")

	hasError := token.IsEmpty() || url.IsEmpty() || org.IsEmpty() || bucket.IsEmpty() || ampqUrl.IsEmpty()

	if token.IsEmpty() {
		log.Fatalln("Empty token")
	}

	if url.IsEmpty() {
		log.Fatalln("Empty url")
	}

	if org.IsEmpty() {
		log.Fatalln("Empty org")
	}

	if bucket.IsEmpty() {
		log.Fatalln("Empty bucket")
	}

	if ampqUrl.IsEmpty() {
		log.Fatalln("Empty ampqUrl")
	}

	environment := sharedUtils.Ternary[internal.TimeSeriesStoreEnvironment](!hasError, internal.TimeSeriesStoreEnvironment{
		InfluxToken:  token.GetPayload(),
		InfluxUrl:    url.GetPayload(),
		InfluxOrg:    org.GetPayload(),
		InfluxBucket: bucket.GetPayload(),
		AmqpURLValue: ampqUrl.GetPayload(),
	}, internal.TimeSeriesStoreEnvironment{})

	return hasError, environment
}
