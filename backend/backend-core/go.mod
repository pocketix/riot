module github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core

go 1.22

require (
	github.com/99designs/gqlgen v0.17.46
	github.com/DATA-DOG/go-sqlmock v1.5.2
	github.com/MichalBures-OG/bp-bures-SfPDfSD-commons v0.0.0-00010101000000-000000000000
	github.com/go-chi/chi/v5 v5.0.12
	github.com/google/uuid v1.6.0
	github.com/gorilla/websocket v1.5.1
	github.com/rs/cors v1.11.0
	github.com/vektah/gqlparser/v2 v2.5.11
	gorm.io/driver/postgres v1.5.7
	gorm.io/gorm v1.25.10
)

replace github.com/MichalBures-OG/bp-bures-SfPDfSD-commons => ./../commons

require (
	github.com/agnivade/levenshtein v1.1.1 // indirect
	github.com/cpuguy83/go-md2man/v2 v2.0.4 // indirect
	github.com/davecgh/go-spew v1.1.1 // indirect
	github.com/hashicorp/golang-lru/v2 v2.0.7 // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20221227161230-091c0ba34f0a // indirect
	github.com/jackc/pgx/v5 v5.4.3 // indirect
	github.com/jinzhu/inflection v1.0.0 // indirect
	github.com/jinzhu/now v1.1.5 // indirect
	github.com/kr/text v0.2.0 // indirect
	github.com/mitchellh/mapstructure v1.5.0 // indirect
	github.com/rabbitmq/amqp091-go v1.9.0 // indirect
	github.com/rogpeppe/go-internal v1.11.0 // indirect
	github.com/russross/blackfriday/v2 v2.1.0 // indirect
	github.com/sosodev/duration v1.3.0 // indirect
	github.com/urfave/cli/v2 v2.27.2 // indirect
	github.com/xrash/smetrics v0.0.0-20240312152122-5f08fbb34913 // indirect
	golang.org/x/crypto v0.22.0 // indirect
	golang.org/x/mod v0.17.0 // indirect
	golang.org/x/net v0.24.0 // indirect
	golang.org/x/sync v0.7.0 // indirect
	golang.org/x/text v0.15.0 // indirect
	golang.org/x/tools v0.20.0 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
)
