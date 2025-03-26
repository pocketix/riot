package internal

import (
	"context"
	"fmt"
	sharedModel "github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	influxdb2 "github.com/influxdata/influxdb-client-go/v2"
	"github.com/influxdata/influxdb-client-go/v2/api"
	"log"
	"strings"
	"time"
)

type Influx2Client struct {
	endpoint     string
	organization string
	bucket       string
	client       influxdb2.Client
	writeApi     api.WriteAPIBlocking
	queryApi     api.QueryAPI
}

func NewInflux2Client(endpoint string, token string, organization string, bucket string) Influx2Client {
	client := influxdb2.NewClientWithOptions(endpoint, token, influxdb2.DefaultOptions().SetBatchSize(20))

	influx2Client := Influx2Client{
		endpoint:     endpoint,
		organization: organization,
		bucket:       bucket,
		client:       client,
		writeApi:     client.WriteAPIBlocking(organization, bucket),
		queryApi:     client.QueryAPI(organization),
	}
	return influx2Client
}

func (influx2Client Influx2Client) Query(body sharedModel.ReadRequestBody) sharedUtils.Result[[]sharedModel.OutputData] {
	aggregation := createAggregation(body)
	timeRange := convertTimeToQueryTimePart(body)
	filter := createFilter(body)
	imports := ""

	if body.Timezone != "" {
		imports = "import \"timezone\""
	}

	query := fmt.Sprintf("%s\n\n"+ // imports
		"from(bucket: \"%s\")\n"+
		"  %s\n"+ // time range
		"  %s\n"+ // filter
		"  %s\n"+ // aggregation
		"  |> drop(columns: [\"_start\", \"_stop\", \"host\", \"deviceType\"])\n"+
		"  |> pivot(columnKey: [\"_field\"], rowKey: [\"_measurement\", \"_time\"], valueColumn: \"_value\")\n"+
		"  |> rename(columns: {_time: \"time\", _measurement: \"deviceId\"})\n"+
		"  |> group(columns: [\"measurement\"], mode: \"by\")", imports, influx2Client.bucket, timeRange, filter, aggregation)

	log.Println(query)

	result, err := influx2Client.queryApi.Query(context.Background(), query)

	if err != nil {
		return sharedUtils.NewFailureResult[[]sharedModel.OutputData](err)
	}

	outputData := []sharedModel.OutputData{}

	if result.Err() != nil {
		return sharedUtils.NewFailureResult[[]sharedModel.OutputData](result.Err())
	}

	for result.Next() {
		outputData = append(outputData, mapToOutputData(result.Record().Values()))
	}

	return sharedUtils.NewSuccessResult[[]sharedModel.OutputData](outputData)
}

func (influx2Client Influx2Client) Write(data sharedModel.InputData) {
	log.Printf("Writing %s with ts %s received ts %f\n", data.SDInstanceUID, time.Unix(int64(data.Timestamp), 0), data.Timestamp)
	if parameters, ok := data.Parameters.(map[string]interface{}); ok {
		// Drop nil / null values
		for key, value := range parameters {
			if value == nil {
				log.Printf("Dropping %s because it was nil / null", key)
				delete(parameters, key)
			}
		}

		point := influxdb2.NewPoint(data.SDInstanceUID, map[string]string{"deviceType": data.SDTypeSpecification}, parameters, time.Unix(int64(data.Timestamp), 0))

		ctx, cancelFunction := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancelFunction()

		err := influx2Client.writeApi.WritePoint(ctx, point)
		if err != nil {
			log.Printf("Writing %s failed with %s\n", data.SDInstanceUID, err)
		}

		err = influx2Client.writeApi.Flush(ctx)
		if err != nil {
			log.Printf("Writing %s failed with %s\n", data.SDInstanceUID, err)
		}

	} else {
		log.Println("parameterAsAny is not a map[string]interface{}")
	}
}

func (influx2Client Influx2Client) Close() {
	influx2Client.client.Close()
}

func convertTimeToQueryTimePart(body sharedModel.ReadRequestBody) string {
	if body.From != nil && body.To == nil {
		currentDate := time.Now()

		currentDateString := currentDate.Format(time.RFC3339)

		return fmt.Sprintf("|> range(start: %s, stop: %s)", body.From.Format(time.RFC3339), currentDateString)
	}

	if body.From == nil && body.To != nil {
		thirtyDaysAgo := body.To.AddDate(0, 0, -30)

		thirtyDaysAgoString := thirtyDaysAgo.Format(time.RFC3339)

		return fmt.Sprintf("|> range(start: %s, stop: %s)", thirtyDaysAgoString, body.To.Format(time.RFC3339))
	}

	if body.From == nil && body.To == nil {
		currentDate := time.Now()
		thirtyDaysAgo := currentDate.AddDate(0, 0, -30)

		currentDateString := currentDate.Format(time.RFC3339)
		thirtyDaysAgoString := thirtyDaysAgo.Format(time.RFC3339)

		return fmt.Sprintf("|> range(start: %s, stop: %s)", thirtyDaysAgoString, currentDateString)
	}

	return fmt.Sprintf("|> range(start: %s, stop: %s)", body.From.Format(time.RFC3339), body.To.Format(time.RFC3339))
}

func createFilter(body sharedModel.ReadRequestBody) string {
	var filterStrings []string

	log.Printf("Getting sensors: %s\n", body.Sensors)
	if sharedModel.AreSimpleSensors(body.Sensors) {
		simpleSensors := body.Sensors.(sharedModel.SimpleSensors)
		for _, sensor := range simpleSensors {
			filterStrings = append(filterStrings, fmt.Sprintf(`r["_measurement"] == "%s"`, sensor))
		}
	} else {
		sensorsWithFields := body.Sensors.(sharedModel.SensorsWithFields)
		for sensor, fields := range sensorsWithFields {
			var fieldConditions []string
			for _, field := range fields {
				fieldConditions = append(fieldConditions, fmt.Sprintf(`r["_field"] == "%s"`, field))
			}
			fieldCondition := strings.Join(fieldConditions, " or ")
			if fieldCondition != "" {
				fieldCondition = " and (" + fieldCondition + ")"
			}
			filterStrings = append(filterStrings, fmt.Sprintf(`(r["_measurement"] == "%s"%s)`, sensor, fieldCondition))
		}
	}

	filter := strings.Join(filterStrings, " or ")

	return fmt.Sprintf("|> filter(fn: (r) => %s)", filter)
}

func createAggregation(body sharedModel.ReadRequestBody) string {
	aggregation := ""

	if body.Operation != "" {
		zone := ""

		if body.AggregateMinutes == 0 {
			body.AggregateMinutes = 10
		}

		if body.Timezone != "" {
			zone = fmt.Sprintf(", location: timezone.location(name: \"%s\")", body.Timezone)
		}

		aggregation = fmt.Sprintf("|> aggregateWindow(every: %dm, fn: %s, createEmpty: false%s)", body.AggregateMinutes, body.Operation, zone)
	}

	return aggregation
}

// mapToOutputData converts a map[string]interface{} to an OutputData struct.
func mapToOutputData(influxOutput map[string]interface{}) sharedModel.OutputData {
	outputData := sharedModel.OutputData{
		Result:     "",
		Table:      influxOutput["table"].(int64),
		Time:       influxOutput["time"].(time.Time),
		DeviceID:   influxOutput["deviceId"].(string),
		DeviceType: "",
	}

	if value, exists := influxOutput["deviceType"]; exists {
		outputData.DeviceType = value.(string)
		delete(influxOutput, "deviceType")
	} else {
		outputData.DeviceType = ""
	}

	if value, exists := influxOutput["result"]; exists {
		outputData.DeviceType = value.(string)
		delete(influxOutput, "result")
	} else {
		outputData.DeviceType = ""
	}

	for key, value := range influxOutput {
		if value == nil {
			delete(influxOutput, key)
		}
	}

	delete(influxOutput, "result")
	delete(influxOutput, "table")
	delete(influxOutput, "time")
	delete(influxOutput, "deviceId")
	delete(influxOutput, "host")

	outputData.Data = influxOutput

	return outputData
}
