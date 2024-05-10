package main

import (
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/api/graphql"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/api/graphql/generated"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/service"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/rabbitmq"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
	"github.com/go-chi/chi/v5"
	"github.com/gorilla/websocket"
	"github.com/rs/cors"
	"log"
	"net/http"
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
	go service.CheckForSDInstanceRegistrationRequests(&graphql.SDInstanceChannel)
	go service.CheckForKPIFulfillmentCheckResults()
	// Set up the GraphQL API
	gqlServer := handler.New(generated.NewExecutableSchema(generated.Config{Resolvers: &graphql.Resolver{}}))
	gqlServer.AddTransport(transport.POST{})
	gqlServer.AddTransport(transport.Websocket{
		KeepAlivePingInterval: 10 * time.Second,
		Upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
	})
	gqlServer.Use(extension.Introspection{})
	router := chi.NewRouter()
	router.Handle("/", cors.New(cors.Options{
		AllowedOrigins:   util.SliceOf("http://localhost:1234", "http://localhost:8080"),
		AllowCredentials: true,
		Debug:            false,
	}).Handler(gqlServer))
	log.Fatal(http.ListenAndServe(":9090", router))
}
