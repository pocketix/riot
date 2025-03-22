package graphql

import (
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/api/graphql/gsc"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/auth"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"github.com/go-chi/chi/v5"
	"github.com/gorilla/websocket"
	"github.com/rs/cors"
	"log"
	"net/http"
	"strings"
	"time"
)

var (
	SDInstanceGraphQLSubscriptionChannel                    = make(chan graphQLModel.SDInstance)
	KPIFulfillmentCheckResulTupleGraphQLSubscriptionChannel = make(chan graphQLModel.KPIFulfillmentCheckResultTuple)
	SDParameterSnapshotUpdateSubscriptionChannel            = make(chan graphQLModel.SDParameterSnapshot)
)

func SetupGraphQLServer() {
	allowedOrigins := sharedUtils.NewSetFromSlice(strings.Split(sharedUtils.GetEnvironmentVariableValue("ALLOWED_ORIGINS").GetPayloadOrDefault("http://localhost:8080,http://localhost:1234"), ","))
	graphQLServer := handler.New(gsc.NewExecutableSchema(gsc.Config{Resolvers: new(Resolver)}))
	graphQLServer.AddTransport(transport.POST{})
	graphQLServer.AddTransport(transport.Websocket{
		KeepAlivePingInterval: 10 * time.Second,
		Upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				origin := r.Header.Get("Origin")
				return allowedOrigins.Contains(origin)
			},
		},
	})
	graphQLServer.Use(extension.Introspection{})
	router := chi.NewRouter()
	router.Use(cors.New(cors.Options{
		AllowedOrigins:   allowedOrigins.ToSlice(),
		AllowCredentials: true,
		Debug:            false,
	}).Handler)
	router.Handle("/", auth.JWTAuthenticationMiddleware(graphQLServer))
	router.Get("/auth/login", auth.LoginHandler)
	router.Get("/auth/logout", auth.LogoutHandler)
	router.Get("/auth/callback", auth.CallbackHandler)
	log.Fatal(http.ListenAndServe(":9090", router))
}
