module github.com/MichalBures-OG/bp-bures-RIoT-message-processing-unit

go 1.24.1

require (
	github.com/MichalBures-OG/bp-bures-RIoT-commons v0.0.0-00010101000000-000000000000
	github.com/google/uuid v1.6.0
)

require (
	github.com/davecgh/go-spew v1.1.1 // indirect
	github.com/dchest/uniuri v1.2.0 // indirect
	github.com/rabbitmq/amqp091-go v1.10.0 // indirect
)

replace github.com/MichalBures-OG/bp-bures-RIoT-commons => ./../commons
