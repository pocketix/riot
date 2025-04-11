module github.com/pocketix/interpret-unit

go 1.24.2

require (
	github.com/MichalBures-OG/bp-bures-RIoT-commons v0.0.0-00010101000000-000000000000
	github.com/pocketix/pocketix-go v0.0.2-alpha
	github.com/rabbitmq/amqp091-go v1.10.0
)

replace github.com/MichalBures-OG/bp-bures-RIoT-commons => ./../commons

require (
	github.com/davecgh/go-spew v1.1.1 // indirect
	github.com/dchest/uniuri v1.2.0 // indirect
)
