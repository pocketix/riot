package model

type UpstreamMQTTMessageInJSONBasedProprietaryFormatOfLogimic struct {
	Notification struct {
		MessageID string  `json:"msgId"`
		Timestamp float32 `json:"tst"`
	} `json:"ntf"`
	Data struct {
		SDArray []struct {
			Type       string `json:"devType"`
			UID        string `json:"devUid"`
			Attributes any    `json:"devAttrs"`
			Parameters any    `json:"devPars"`
		} `json:"devs"`
	} `json:"data"`
	Topic          string `json:"topic"`
	TopicPrefix    string `json:"topicPrefix"`
	ApplicationID  string `json:"appId"`
	Directory      string `json:"dir"`
	ConnectionName string `json:"connName"`
}
