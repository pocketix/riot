package main

import (
	"bp-bures-SfPDfSD/src/api/graphql"
	"bp-bures-SfPDfSD/src/middleware"
	rdb "bp-bures-SfPDfSD/src/persistence/relational-database"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {

	// Initial setup of the relational-database client "singleton"
	_, err := rdb.GetRelationalDatabaseClient()
	if err != nil {
		log.Println("Error while trying to setup the relational-database client: terminating...")
		return
	}

	// Starting KPI processing in a separate Goroutine
	go middleware.StartProcessingKPIs()

	// General web framework setup
	app := fiber.New()
	app.Use(cors.New(cors.Config{ // Enabling CORS for the front-end (port 1234)
		AllowOrigins: "http://localhost:1234",
	}))

	// GraphQL API setup
	graphql.SetupGraphQLServer(app)

	// Final step: Exposing the GraphQL API of the system on port 9090
	log.Fatal(app.Listen(":9090"))
}
