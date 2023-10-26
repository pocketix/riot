package dto

type Dev5UpstreamMessageDTO struct {
	Notification   Dev5NotificationDTO `json:"ntf"`
	Data           Dev5DataDTO         `json:"data"`
	Topic          string              `json:"topic"`
	TopicPrefix    string              `json:"topicPrefix"`
	AppId          string              `json:"appId"`
	Directory      string              `json:"dir"`
	ConnectionName string              `json:"connName"`
}

type Dev5NotificationDTO struct {
	MessageID string  `json:"msgId"`
	Timestamp float32 `json:"tst"`
}

type Dev5DataDTO struct {
	Devices []Dev5DeviceDTO `json:"devs"`
}

type Dev5DeviceDTO struct {
	DeviceType       string      `json:"devType"`
	DeviceUID        string      `json:"devUid"`
	DeviceAttributes interface{} `json:"devAttrs"`
	DeviceParameters interface{} `json:"devPars"`
}
