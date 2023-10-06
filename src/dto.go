package main

type UpstreamMessage struct {
	Notification   Notification `json:"ntf"`
	Data           Data         `json:"data"`
	Topic          string       `json:"topic"`
	TopicPrefix    string       `json:"topicPrefix"`
	AppId          string       `json:"appId"`
	Directory      string       `json:"dir"`
	ConnectionName string       `json:"connName"`
}

type Notification struct {
	MessageId string  `json:"msgId"`
	Timestamp float32 `json:"tst"`
}

type Data struct {
	Devices []Device `json:"devs"`
}

type Device struct {
	DeviceType       string      `json:"devType"`
	DeviceUid        string      `json:"devUid"`
	DeviceAttributes interface{} `json:"devAttrs"`
	DeviceParameters interface{} `json:"devPars"`
}
