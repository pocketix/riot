package main

import (
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/api/graphql"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/api/graphql/generated"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/service"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/rabbitmq"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/adaptor"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"log"
	"time"
)

func main() {
	util.TerminateOnError(util.WaitForDSs(time.Minute, util.NewPairOf("rabbitmq", 5672), util.NewPairOf("postgres", 5432)), "Some dependencies of this application are inaccessible")
	// Set up PostgreSQL database and its client
	db.SetupRelationalDatabaseClient()
	// Set up RabbitMQ "infrastructure"
	rabbitmq.SetupRabbitMQ()
	// Set up RabbitMQ inside the 'Backend core' service
	service.SetupRabbitMQClient()
	util.TerminateOnError(service.EnqueueMessagesRepresentingCurrentConfiguration(), "Couldn't enqueue messages representing the system configuration after 'Backend core' restart")
	go service.CheckForSDInstanceRegistrationRequests()
	go service.CheckForKPIFulfillmentCheckResults()
	// Set up the Fiber web application and GraphQL API
	app := fiber.New()
	app.Use(cors.New(cors.Config{AllowOrigins: "http://localhost:1234, http://localhost:8080"}))
	app.Use("/", adaptor.HTTPHandler(handler.NewDefaultServer(generated.NewExecutableSchema(generated.Config{Resolvers: &graphql.Resolver{}}))))
	log.Fatal(app.Listen(":9090"))
}
