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
	switch sensors.(type) {
	case SimpleSensors:
		return true
	case []string:
		return true
	default:
		return false
	}
}

// Operation represents aggregation operations.
type Operation string

// InputData represents a single input data point.
type InputData struct {
	Timestamp           float64 `json:"timestamp"`
	SDInstanceUID       string  `json:"sdInstanceUID"`
	SDTypeSpecification string  `json:"sdTypeSpecification"`
	Parameters          any     `json:"parameters"`
}

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
	Operation        Operation  `json:"operation,omitempty"`
	Timezone         string     `json:"timezone,omitempty"`
	From             *time.Time `json:"from,omitempty"`
	To               *time.Time `json:"to,omitempty"`
	AggregateMinutes int        `json:"aggregateMinutes,omitempty"`
}

// UnmarshalJSON customizes the JSON unmarshaling for ReadRequestBody.
func (r *ReadRequestBody) UnmarshalJSON(data []byte) error {
	type Alias ReadRequestBody
	aux := &struct {
		From    string          `json:"from"`
		To      string          `json:"to"`
		Sensors json.RawMessage `json:"sensors"` // Delay parsing sensors
		Alias
	}{
		Alias: (Alias)(*r),
	}

	// Unmarshal into aux
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}

	// Parse time fields safely
	if aux.From != "" {
		fromTime, err := time.Parse(time.RFC3339, aux.From)
		if err != nil {
			return fmt.Errorf("invalid 'from' time format: %s", aux.From)
		}
		r.From = &fromTime
	}

	if aux.To != "" {
		toTime, err := time.Parse(time.RFC3339, aux.To)
		if err != nil {
			return fmt.Errorf("invalid 'to' time format: %s", aux.To)
		}
		r.To = &toTime
	}

	// Assign other fields
	r.Operation = aux.Operation
	r.Timezone = aux.Timezone
	r.AggregateMinutes = aux.AggregateMinutes

	// Try to parse Sensors as SimpleSensors
	var simpleSensors SimpleSensors
	if err := json.Unmarshal(aux.Sensors, &simpleSensors); err == nil {
		r.Sensors = simpleSensors
		return nil
	}

	// Try to parse Sensors as SensorsWithFields
	var sensorsWithFields SensorsWithFields
	if err := json.Unmarshal(aux.Sensors, &sensorsWithFields); err == nil {
		r.Sensors = sensorsWithFields
		return nil
	}

	// If neither format works, return an error
	return fmt.Errorf("unsupported sensors format: %s", string(aux.Sensors))
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

// MarshalJSON marshals SimpleSensors to JSON.
func (simpleSensors SimpleSensors) MarshalJSON() ([]byte, error) {
	return json.Marshal([]string(simpleSensors))
}

// MarshalJSON marshals SensorsWithFields to JSON.
func (sensorsWithFields SensorsWithFields) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string][]string(sensorsWithFields))
}
