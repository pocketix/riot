package main

import (
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/api/graphql"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/api/graphql/generated"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/isc"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
	"github.com/go-chi/chi/v5"
	"github.com/gorilla/websocket"
	"github.com/rs/cors"
	"log"
	"net/http"
	"time"
)

func waitForDependencies() {
	rabbitMQ := util.NewPairOf("rabbitmq", 5672)
	postgreSQL := util.NewPairOf("postgres", 5432)
	util.TerminateOnError(util.WaitForDSs(time.Minute, rabbitMQ, postgreSQL), "Some dependencies of this application are inaccessible")
}

func setupISC() {
	isc.SetupRabbitMQInfrastructureForISC()
	isc.EnqueueMessagesRepresentingCurrentSystemConfiguration()
	go isc.ProcessIncomingSDInstanceRegistrationRequests(&graphql.SDInstanceChannel)
	go isc.ProcessIncomingKPIFulfillmentCheckResults(&graphql.KPIFulfillmentCheckResultChannel)
}

func setupGraphQLServer() {
	graphQLServer := handler.New(generated.NewExecutableSchema(generated.Config{Resolvers: new(graphql.Resolver)}))
	graphQLServer.AddTransport(transport.POST{})
	graphQLServer.AddTransport(transport.Websocket{
		KeepAlivePingInterval: 10 * time.Second,
		Upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
	})
	graphQLServer.Use(extension.Introspection{})
	router := chi.NewRouter()
	router.Handle("/", cors.New(cors.Options{
		AllowedOrigins:   util.SliceOf("http://localhost:1234", "http://localhost:8080"),
		AllowCredentials: true,
		Debug:            false,
	}).Handler(graphQLServer))
	log.Fatal(http.ListenAndServe(":9090", router))
}

func main() {
	waitForDependencies()
	setupISC()
	setupGraphQLServer()
}
