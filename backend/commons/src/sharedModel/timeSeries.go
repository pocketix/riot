package sharedModel

import (
	"encoding/json"
	"fmt"
	"time"
)

// Sensors represents the sensors to be queried.
type Sensors interface{}

// SimpleSensors represents a simple definition of sensors.
type SimpleSensors []string

// SensorsWithFields represents sensors with specific fields.
type SensorsWithFields map[string][]string

// AreSimpleSensors checks if the sensors are of type SimpleSensors.
func AreSimpleSensors(sensors interface{}) bool {
	_, ok := sensors.(SimpleSensors)
	return ok
}

// Operation represents aggregation operations.
type Operation string

// InputData represents a single input data point.
type InputData KPIFulfillmentCheckRequestISCMessage

// OutputData represents a single data point retrieved from InfluxDB.
type OutputData struct {
	Result     string                 `json:"result"`     // Result metadata
	Table      int64                  `json:"table"`      // Table number metadata
	Time       time.Time              `json:"time"`       // Time of the current data sample
	DeviceID   string                 `json:"deviceId"`   // Device identifier
	DeviceType string                 `json:"deviceType"` // Device type
	Data       map[string]interface{} `json:"data"`
}

// ReadRequestBody represents the request body for the statistics endpoint.
type ReadRequestBody struct {
	Sensors          Sensors    `json:"sensors"`
	Operation        Operation  `json:"operation"`
	Timezone         string     `json:"timezone,omitempty"`
	From             *time.Time `json:"from,omitempty"`
	To               *time.Time `json:"to,omitempty"`
	AggregateMinutes int        `json:"aggregateMinutes,omitempty"`
}

// UnmarshalJSON unmarshals JSON to the OutputData struct.
func (outputData *OutputData) UnmarshalJSON(data []byte) error {
	type Alias OutputData
	aux := &struct {
		Time string `json:"time"`
		*Alias
	}{
		Alias: (*Alias)(outputData),
	}
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}
	parsedTime, err := time.Parse(time.RFC3339, aux.Time)
	if err != nil {
		return err
	}
	outputData.Time = parsedTime
	return nil
}

// UnmarshalJSON unmarshals JSON to the ReadRequestBody struct.
func (r *ReadRequestBody) UnmarshalJSON(data []byte) error {
	type Alias ReadRequestBody
	aux := &struct {
		Sensors interface{} `json:"sensors"`
		Alias
	}{
		Alias: (Alias)(*r),
	}

	var z map[string]interface{}

	if err := json.Unmarshal(data, &z); err != nil {
		fmt.Println(string(data[:]))
		panic(err)
	}

	convertedFrom, _ := time.Parse(time.RFC3339, z["from"].(string))
	convertedTo, _ := time.Parse(time.RFC3339, z["to"].(string))

	r.From = &convertedFrom
	r.To = &convertedTo
	r.AggregateMinutes = int(z["aggregateMinutes"].(float64))
	r.Timezone = z["timezone"].(string)
	r.Operation = Operation(z["operation"].(string))

	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}

	switch v := aux.Sensors.(type) {
	case map[string]interface{}:
		sensorsWithFields := SensorsWithFields{}
		for key, value := range v {
			if values, ok := value.([]interface{}); ok {
				fields := make([]string, len(values))
				for i, val := range values {
					if field, ok := val.(string); ok {
						fields[i] = field
					} else {
						return fmt.Errorf("unexpected field type: %T", val)
					}
				}
				sensorsWithFields[key] = fields
			} else {
				return fmt.Errorf("unexpected sensor type: %T", value)
			}
		}
		r.Sensors = sensorsWithFields
	case []interface{}:
		simpleSensors := make([]string, len(v))
		for i, sensor := range v {
			if s, ok := sensor.(string); ok {
				simpleSensors[i] = s
			} else {
				return fmt.Errorf("unexpected sensor type: %T", sensor)
			}
		}
		r.Sensors = SimpleSensors(simpleSensors)
	default:
		return fmt.Errorf("unsupported sensors type: %T", aux.Sensors)
	}
	return nil
}

// MarshalJSON marshals ReadRequestBody to JSON.
func (r *ReadRequestBody) MarshalJSON() ([]byte, error) {
	type Alias ReadRequestBody
	if r.Sensors == nil {
		// If Sensors field is nil, omit it from the JSON output
		r.Sensors = []string{}
	}
	return json.Marshal(&struct{ Alias }{Alias: (Alias)(*r)})
}

// MarshalJSON marshals the OutputData struct to JSON.
func (outputData OutputData) MarshalJSON() ([]byte, error) {
	data := make(map[string]interface{}, len(outputData.Data)+5)

	// copy status fields
	for k, v := range outputData.Data {
		data[k] = v
	}
	// add known keys
	data["time"] = outputData.Time.Format(time.RFC3339)
	data["deviceId"] = outputData.DeviceID
	data["deviceType"] = outputData.DeviceType
	data["result"] = outputData.Result
	data["table"] = outputData.Table

	return json.Marshal(data)
}

// MarshalJSON marshals SimpleSensors to JSON.
func (simpleSensors SimpleSensors) MarshalJSON() ([]byte, error) {
	return json.Marshal([]string(simpleSensors))
}

// MarshalJSON marshals SensorsWithFields to JSON.
func (sensorsWithFields SensorsWithFields) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string][]string(sensorsWithFields))
}
