module github.com/pocketix/interpret-unit

go 1.24.2

require (
	github.com/pocketix/riot/commons v0.0.0-00010101000000-000000000000
	github.com/pocketix/pocketix-go v1.2.0
	github.com/rabbitmq/amqp091-go v1.10.0
)

replace github.com/pocketix/riot/commons => ./../commons

require (
	github.com/davecgh/go-spew v1.1.1 // indirect
	github.com/dchest/uniuri v1.2.0 // indirect
)
