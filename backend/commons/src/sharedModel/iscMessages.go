package sharedModel

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
