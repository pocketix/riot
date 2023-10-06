package main

import (
	"log"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

const (
	MqttQosAtMostOnce  = 0
	MqttQosAtLeastOnce = 1
	MqttQosExactlyOnce = 2
)

type EclipsePahoBasedAsynchronousMqttClient interface {
	Connect() error
	Subscribe(topic string, qos byte, incomingMessageCallbackFunction mqtt.MessageHandler) error
	Publish(topic string, qos byte, messagePayload interface{}) error
}

type eclipsePahoBasedAsynchronousMqttClientImpl struct {
	client mqtt.Client
}

// NewEclipsePahoBasedAsynchronousMqttClient is a constructor-like function that returns an instance of EclipsePahoBasedAsynchronousMqttClient
func NewEclipsePahoBasedAsynchronousMqttClient(brokerUri string, clientId string, username string, password string) EclipsePahoBasedAsynchronousMqttClient {
	opts := mqtt.NewClientOptions()
	opts.AddBroker(brokerUri)
	opts.SetClientID(clientId)
	opts.SetUsername(username)
	opts.SetPassword(password)
	client := mqtt.NewClient(opts)
	return &eclipsePahoBasedAsynchronousMqttClientImpl{client: client}
}

func (p *eclipsePahoBasedAsynchronousMqttClientImpl) Connect() error {
	token := p.client.Connect()
	token.Wait()
	err := token.Error()
	if err != nil {
		log.Println("Error on Client.Connect(): ", err)
		return err
	}
	return nil
}

func (p *eclipsePahoBasedAsynchronousMqttClientImpl) Subscribe(topic string, qos byte, incomingMessageCallbackFunction mqtt.MessageHandler) error {
	token := p.client.Subscribe(topic, qos, incomingMessageCallbackFunction)
	token.Wait()
	err := token.Error()
	if err != nil {
		log.Println("Error on Client.Subscribe(): ", err)
		return err
	}
	return nil
}

func (p *eclipsePahoBasedAsynchronousMqttClientImpl) Publish(topic string, qos byte, messagePayload interface{}) error {
	token := p.client.Publish(topic, qos, false, messagePayload)
	token.Wait()
	err := token.Error()
	if err != nil {
		log.Println("Error on Client.Publish(): ", err)
		return err
	}
	return nil
}
