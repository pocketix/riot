package main

import (
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/api/graphql"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/api/graphql/generated"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/rabbitmq"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/adaptor"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"log"
)

func main() {
	// Set up PostgreSQL database and its client
	db.SetupRelationalDatabaseClient()
	// Set up RabbitMQ "infrastructure"
	rabbitmq.SetupRabbitMQ()
	// Set up the Fiber web application and GraphQL API
	app := fiber.New()
	app.Use(cors.New(cors.Config{AllowOrigins: "http://localhost:1234"}))
	app.Use("/", adaptor.HTTPHandler(handler.NewDefaultServer(generated.NewExecutableSchema(generated.Config{Resolvers: &graphql.Resolver{}}))))
	log.Fatal(app.Listen(":9090"))
}
