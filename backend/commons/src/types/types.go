package types

type RequestForKPIFulfillmentCheck struct {
	Timestamp  float32 `json:"timestamp"`
	SD         SDInfo  `json:"sd"`
	Parameters any     `json:"parameters"`
}

type RequestForSDInstanceRegistration struct {
	Timestamp float32 `json:"timestamp"`
	SD        SDInfo  `json:"sd"`
}

type SDInfo struct {
	UID  string `json:"uid"`
	Type string `json:"type"`
}

type SDInstanceInfo struct {
	UID             string `json:"denotation"`
	ConfirmedByUser bool   `json:"confirmedByUser"`
}
