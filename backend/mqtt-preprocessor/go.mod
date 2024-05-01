module github.com/MichalBures-OG/bp-bures-SfPDfSD-MQTT-preprocessor

go 1.22

require (
	github.com/MichalBures-OG/bp-bures-SfPDfSD-commons v0.0.0-00010101000000-000000000000
	github.com/eclipse/paho.mqtt.golang v1.4.3
)

replace github.com/MichalBures-OG/bp-bures-SfPDfSD-commons => ./../commons

require (
	github.com/google/uuid v1.6.0 // indirect
	github.com/gorilla/websocket v1.5.1 // indirect
	github.com/rabbitmq/amqp091-go v1.9.0 // indirect
	golang.org/x/net v0.22.0 // indirect
	golang.org/x/sync v0.6.0 // indirect
)
