module github.com/MichalBures-OG/bp-bures-RIoT-MQTT-preprocessor

go 1.22

require (
	github.com/MichalBures-OG/bp-bures-RIoT-commons v0.0.0-00010101000000-000000000000
	github.com/eclipse/paho.mqtt.golang v1.4.3
	github.com/google/uuid v1.6.0
)

replace github.com/MichalBures-OG/bp-bures-RIoT-commons => ./../commons

require (
	github.com/davecgh/go-spew v1.1.1 // indirect
	github.com/gorilla/websocket v1.5.1 // indirect
	github.com/rabbitmq/amqp091-go v1.10.0 // indirect
	golang.org/x/net v0.22.0 // indirect
	golang.org/x/sync v0.6.0 // indirect
)
