package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/rabbitmq"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedConstants"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/xjohnp00/jiap/backend/shared/time-series-store/src/internal"
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

			fmt.Printf("%s\n", result)
			jsonData := make([]byte, 0)
			var err error

			if result.IsSuccess() {
				jsonData, err = json.Marshal(result.GetPayload())
			}

			fmt.Printf("%s\n", jsonData)

			if err != nil {
				fmt.Printf("Error During Marshall: %s", err)
			}

			err = rabbitMQClient.PublishJSONMessageRPC(
				sharedUtils.NewEmptyOptional[string](),
				sharedUtils.NewOptionalOf(delivery.ReplyTo),
				jsonData,
				delivery.CorrelationId,
				sharedUtils.NewEmptyOptional[string](),
			)

			if err != nil {
				fmt.Printf("Error: %s", err)
				return err
			}
			return nil
		},
	)
	return err
}

func parseParameters() (bool, internal.TimeSeriesStoreEnvironment) {
	flag.Parse()
	token, tokenError := sharedUtils.GetEnvironmentParameter("INFLUX_TOKEN", "InfluxDB Token")
	url, urlError := sharedUtils.GetEnvironmentParameter("INFLUX_URL", "InfluxDB URL")
	org, orgError := sharedUtils.GetEnvironmentParameter("INFLUX_ORGANIZATION", "InfluxDB Organization")
	bucket, bucketError := sharedUtils.GetEnvironmentParameter("INFLUX_BUCKET", "InfluxDB Bucket")
	ampqUrl, ampqUrlError := sharedUtils.GetEnvironmentParameter("RABBITMQ_URL", "RABBITMQ Broker URL")

	hasError := tokenError != nil || urlError != nil || orgError != nil || bucketError != nil || ampqUrlError != nil

	if tokenError != nil {
		fmt.Println(fmt.Errorf(tokenError.Error()))
	}

	if urlError != nil {
		fmt.Println(fmt.Errorf(urlError.Error()))
	}

	if orgError != nil {
		fmt.Println(fmt.Errorf(orgError.Error()))
	}

	if bucketError != nil {
		fmt.Println(fmt.Errorf(bucketError.Error()))
	}

	if ampqUrlError != nil {
		fmt.Println(fmt.Errorf(ampqUrlError.Error()))
	}

	environment := internal.TimeSeriesStoreEnvironment{
		InfluxToken:  token,
		InfluxUrl:    url,
		InfluxOrg:    org,
		InfluxBucket: bucket,
		AmqpURLValue: ampqUrl,
	}

	return hasError, environment
}
