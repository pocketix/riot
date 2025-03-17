module github.com/xjohnp00/jiap/backend/shared/time-series-store

go 1.24.1

require (
	github.com/MichalBures-OG/bp-bures-RIoT-commons v0.0.0-00010101000000-000000000000
	github.com/influxdata/influxdb-client-go/v2 v2.14.0
	github.com/rabbitmq/amqp091-go v1.10.0
)

replace github.com/MichalBures-OG/bp-bures-RIoT-commons => ./../commons

require (
	github.com/apapsch/go-jsonmerge/v2 v2.0.0 // indirect
	github.com/davecgh/go-spew v1.1.1 // indirect
	github.com/dchest/uniuri v1.2.0 // indirect
	github.com/google/uuid v1.6.0 // indirect
	github.com/influxdata/line-protocol v0.0.0-20210922203350-b1ad95c89adf // indirect
	github.com/oapi-codegen/runtime v1.1.1 // indirect
	golang.org/x/net v0.37.0 // indirect
)
