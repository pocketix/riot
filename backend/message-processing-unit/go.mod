module github.com/MichalBures-OG/bp-bures-SfPDfSD-message-processing-unit

go 1.22

require github.com/MichalBures-OG/bp-bures-SfPDfSD-commons v0.0.0-00010101000000-000000000000

require (
	github.com/google/uuid v1.6.0 // indirect
	github.com/rabbitmq/amqp091-go v1.9.0 // indirect
)

replace github.com/MichalBures-OG/bp-bures-SfPDfSD-commons => ./../commons
