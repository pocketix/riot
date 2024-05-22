package graphql

import (
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/api/graphql/gsc"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedUtils"
	"github.com/go-chi/chi/v5"
	"github.com/gorilla/websocket"
	"github.com/rs/cors"
	"log"
	"net/http"
	"time"
)

var (
	SDInstanceGraphQLSubscriptionChannel                = make(chan graphQLModel.SDInstance)
	KPIFulfillmentCheckResultGraphQLSubscriptionChannel = make(chan graphQLModel.KPIFulfillmentCheckResult)
)

func SetupGraphQLServer() {
	graphQLServer := handler.New(gsc.NewExecutableSchema(gsc.Config{Resolvers: new(Resolver)}))
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
		AllowedOrigins:   sharedUtils.SliceOf("http://localhost:1234", "http://localhost:8080"),
		AllowCredentials: true,
		Debug:            false,
	}).Handler(graphQLServer))
	log.Fatal(http.ListenAndServe(":9090", router))
}
