package sharedModel

type KPIFulfillmentCheckResultTupleISCMessage []KPIFulfillmentCheckResultISCMessage

type KPIFulfillmentCheckResultISCMessage struct {
	SDInstanceUID   string `json:"sdInstanceUID"`
	KPIDefinitionID uint32 `json:"kpiDefinitionID"`
	Fulfilled       bool   `json:"fulfilled"`
}

type KPIFulfillmentCheckRequestISCMessage struct {
	Timestamp           float32 `json:"timestamp"`
	SDInstanceUID       string  `json:"sdInstanceUID"`
	SDTypeSpecification string  `json:"sdTypeSpecification"`
	Parameters          any     `json:"parameters"`
}

type SDInstanceRegistrationRequestISCMessage struct {
	Timestamp           float32 `json:"timestamp"`
	SDInstanceUID       string  `json:"sdInstanceUID"`
	SDTypeSpecification string  `json:"sdTypeSpecification"`
}

type SDTypeConfigurationUpdateISCMessage []string

type SDInstanceInfo struct {
	SDInstanceUID   string `json:"sdInstanceUID"`
	ConfirmedByUser bool   `json:"confirmedByUser"`
}

type SDInstanceConfigurationUpdateISCMessage []SDInstanceInfo

type KPIConfigurationUpdateISCMessage map[string][]KPIDefinition

type MessageProcessingUnitConnectionNotification struct{}

type ReadRequestResponseOrError struct {
	Data  []OutputData `json:"data,omitempty"`
	Error string       `json:"error,omitempty"`
}

type SDParameterSnapshot struct {
	SDInstanceUID string   `json:"sdInstanceUID"`
	SdParameter   string   `json:"sdParameter"`
	String        *string  `json:"string,omitempty"`
	Number        *float64 `json:"number,omitempty"`
	Boolean       *bool    `json:"boolean,omitempty"`
	UpdatedAt     float64  `json:"updatedAt"`
}

type SDParameterSnapshotInfoMessage []SDParameterSnapshot
