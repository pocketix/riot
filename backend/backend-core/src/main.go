package main

import (
	"bp-bures-SfPDfSD/src/api/graphql"
	"bp-bures-SfPDfSD/src/middleware"
	"bp-bures-SfPDfSD/src/persistence/rdb"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {

	// Setup of the relational-database client
	if err := rdb.SetupRelationalDatabaseClient(); err != nil {
		log.Println("Error while trying to setup the relational-database client: terminating...")
		return
	}

	// Start processing incoming MQTT communication in a separate Goroutine
	go middleware.StartProcessingIncomingMQTTCommunication()

	// General web framework setup
	app := fiber.New()
	app.Use(cors.New(cors.Config{ // Enabling CORS for the front-end (port 1234)
		AllowOrigins: "http://localhost:1234",
	}))

	// GraphQL API setup
	graphql.SetupGraphQLServer(app, *rdb.GetRelationalDatabaseClientReference())

	// Final step: Exposing the GraphQL API of the system on port 9090
	log.Fatal(app.Listen(":9090"))
}
