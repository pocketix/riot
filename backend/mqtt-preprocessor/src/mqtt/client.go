package mqtt

import (
	mqtt "github.com/eclipse/paho.mqtt.golang"
	"log"
)

const (
	QosAtMostOnce  = 0
	QosAtLeastOnce = 1
	QosExactlyOnce = 2
)

type EclipsePahoBasedMqttClient interface {
	Connect() error
	Subscribe(topic string, qos byte, incomingMessageCallbackFunction func([]byte)) error
	Publish(topic string, qos byte, messagePayload any) error
}

type eclipsePahoBasedMqttClientImpl struct {
	client mqtt.Client
}

// NewEclipsePahoBasedMqttClient is a constructor-like function that returns an instance of EclipsePahoBasedMqttClient
func NewEclipsePahoBasedMqttClient(brokerUri string, clientId string, username string, password string) EclipsePahoBasedMqttClient {
	opts := mqtt.NewClientOptions()
	opts.AddBroker(brokerUri)
	opts.SetClientID(clientId)
	opts.SetUsername(username)
	opts.SetPassword(password)
	client := mqtt.NewClient(opts)
	return &eclipsePahoBasedMqttClientImpl{client: client}
}

func (p *eclipsePahoBasedMqttClientImpl) Connect() error {
	token := p.client.Connect()
	token.Wait()
	err := token.Error()
	if err != nil {
		log.Println("Error on Client.Connect(): ", err)
		return err
	}
	return nil
}

func (p *eclipsePahoBasedMqttClientImpl) Subscribe(topic string, qos byte, incomingMessageCallbackFunction func([]byte)) error {
	token := p.client.Subscribe(topic, qos, func(_ mqtt.Client, message mqtt.Message) {
		go incomingMessageCallbackFunction(message.Payload())
	})
	token.Wait()
	err := token.Error()
	if err != nil {
		log.Println("Error on Client.Subscribe(): ", err)
		return err
	}
	return nil
}

func (p *eclipsePahoBasedMqttClientImpl) Publish(topic string, qos byte, messagePayload any) error {
	token := p.client.Publish(topic, qos, false, messagePayload)
	token.Wait()
	err := token.Error()
	if err != nil {
		log.Println("Error on Client.Publish(): ", err)
		return err
	}
	return nil
}
