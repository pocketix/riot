package domainLogicLayer

import (
	"encoding/json"
	"fmt"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/rabbitmq"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedConstants"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedModel"
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

func Query(input sharedModel.ReadRequestBody) sharedUtils.Result[[]graphQLModel.OutputData] {
	request := sharedUtils.SerializeToJSON(input)

	rabbitMQClient := getDLLRabbitMQClient()

	correlationId := randomString(32)

	outputChannel := make(chan sharedUtils.Result[[]sharedModel.OutputData])

	go func() {
		err := rabbitmq.ConsumeJSONMessagesWithAccessToDelivery[[]sharedModel.OutputData](
			rabbitMQClient,
			sharedConstants.TimeSeriesReadRequestBackendCoreResponseQueueName,
			correlationId,
			func(outputData []sharedModel.OutputData, delivery amqp.Delivery) error {
				output := sharedUtils.NewSuccessResult[[]sharedModel.OutputData](outputData)
				outputChannel <- output

				close(outputChannel)
				return nil
			},
		)

		if err != nil {
			close(outputChannel)
			sharedUtils.NewFailureResult[[]graphQLModel.OutputData](err)
		}
	}()

	err := rabbitMQClient.PublishJSONMessageRPC(
		sharedUtils.NewEmptyOptional[string](),
		sharedUtils.NewOptionalOf(sharedConstants.TimeSeriesReadRequestQueueName),
		request.GetPayload(),
		correlationId,
		sharedUtils.NewOptionalOf(sharedConstants.TimeSeriesReadRequestBackendCoreResponseQueueName),
	)

	if err != nil {
		return sharedUtils.NewFailureResult[[]graphQLModel.OutputData](err)
	}

	result := <-outputChannel

	if result.IsFailure() {
		return sharedUtils.NewFailureResult[[]graphQLModel.OutputData](err)
	}

	convertedResult, err := ConvertOutputData(result.GetPayload())

	if err != nil {
		return sharedUtils.NewFailureResult[[]graphQLModel.OutputData](err)
	}

	return sharedUtils.NewSuccessResult[[]graphQLModel.OutputData](convertedResult)
}

func Save(input graphQLModel.InputData) sharedUtils.Result[bool] {
	rabbitMQClient := getDLLRabbitMQClient()
	rabbitMQClient.PublishJSONMessage(sharedUtils.NewOptionalOf(sharedConstants.TimeSeriesStoreDataQueueName), sharedUtils.NewOptionalOf(""), sharedUtils.SerializeToJSON(input).GetPayload())
	return sharedUtils.NewSuccessResult[bool](true)
}

// MapStatisticsInputToReadRequestBody Refactored function with explicit parameters for SimpleSensors and SensorsWithFields
func MapStatisticsInputToReadRequestBody(statsInput *graphQLModel.StatisticsInput, simpleSensors *graphQLModel.SimpleSensors, sensorsWithFields *graphQLModel.SensorsWithFields) (*sharedModel.ReadRequestBody, error) {
	readRequestBody := &sharedModel.ReadRequestBody{}

	// Check if SimpleSensors is provided
	if simpleSensors != nil {
		readRequestBody.Sensors = simpleSensors.Sensors
	} else if sensorsWithFields != nil {
		resultMap := make(map[string][]string)

		// Loop through each SensorField and add it to the result map
		for _, sensor := range sensorsWithFields.Sensors {
			resultMap[sensor.Key] = sensor.Values
		}

		readRequestBody.Sensors = resultMap
	} else {
		return nil, fmt.Errorf("sensors are required, but neither SimpleSensors nor SensorsWithFields were provided")
	}

	// If statsInput is not nil, copy the values
	if statsInput != nil {
		// Copy Operation if present
		if statsInput.Operation != nil {
			readRequestBody.Operation = sharedModel.Operation(*statsInput.Operation)
		}

		// Copy Timezone if present
		if statsInput.Timezone != nil {
			readRequestBody.Timezone = *statsInput.Timezone
		}

		// Copy AggregateMinutes if present
		if statsInput.AggregateMinutes != nil {
			readRequestBody.AggregateMinutes = *statsInput.AggregateMinutes
		}

		// Convert From time (string to *time.Time)
		if statsInput.From != nil {
			parsedTime, err := time.Parse(time.RFC3339, *statsInput.From)
			if err != nil {
				return nil, fmt.Errorf("failed to parse From time: %v", err)
			}
			readRequestBody.From = &parsedTime
		}

		// Convert To time (string to *time.Time)
		if statsInput.To != nil {
			parsedTime, err := time.Parse(time.RFC3339, *statsInput.To)
			if err != nil {
				return nil, fmt.Errorf("failed to parse To time: %v", err)
			}
			readRequestBody.To = &parsedTime
		}
	}

	return readRequestBody, nil
}

// ConvertOutputData converts a slice of sharedModel.OutputData to a slice of graphQLModel.OutputData
func ConvertOutputData(sharedData []sharedModel.OutputData) ([]graphQLModel.OutputData, error) {
	var result []graphQLModel.OutputData

	for _, item := range sharedData {
		// Convert Time to string
		timeString := item.Time.Format(time.RFC3339)

		// Convert Data map to JSON string
		dataBytes, err := json.Marshal(item.Data)
		if err != nil {
			return nil, fmt.Errorf("error marshaling data: %v", err)
		}
		dataString := string(dataBytes)

		// Handle DeviceType (may be empty in sharedModel, so we use pointer in graphQLModel)
		var deviceType *string
		if item.DeviceType != "" {
			deviceType = &item.DeviceType
		}

		// Map to graphQLModel.OutputData
		result = append(result, graphQLModel.OutputData{
			Time:       timeString,
			DeviceID:   item.DeviceID,
			DeviceType: deviceType,
			Data:       dataString,
		})
	}

	return result, nil
}
