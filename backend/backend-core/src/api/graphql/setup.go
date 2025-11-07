package graphql

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/99designs/gqlgen/graphql"
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
	"github.com/vektah/gqlparser/v2/gqlerror"
)

var (
	SDInstanceGraphQLSubscriptionChannel                    = make(chan graphQLModel.SDInstance)
	KPIFulfillmentCheckResulTupleGraphQLSubscriptionChannel = make(chan graphQLModel.KPIFulfillmentCheckResultTuple)
	SDParameterSnapshotUpdateSubscriptionChannel            = make(chan graphQLModel.SDParameterSnapshot)
)

func NoCacheMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, private")
		w.Header().Set("Pragma", "no-cache")
		w.Header().Set("Expires", "0")
		next.ServeHTTP(w, r)
	})
}

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
	graphQLServer.AroundFields(func(ctx context.Context, next graphql.Resolver) (res any, err error) {

		log.Println("In per-GraphQL field authorization middleware.")

		fieldContext := graphql.GetFieldContext(ctx)
		if fieldContext == nil {
			return nil, fmt.Errorf("couldn't obtain GraphQL field context")
		}
		astField := fieldContext.Field.Field
		if astField == nil {
			return nil, fmt.Errorf("couldn't obtain 'ast.Field' struct instance")
		}
		userIDOptional := auth.GetUserID(ctx)
		if userIDOptional.IsEmpty() {
			log.Println("Bypassing per-GraphQL field authorization middleware due to unknown user ID.")
			return next(ctx)
		}
		userID := userIDOptional.GetPayload()
		apiAccessSummary := auth.GetAPIAccessSummary(ctx).GetPayload()
		fieldAccessAuthorizationCheckResult, err := auth.IsFieldAccessAuthorized(apiAccessSummary, astField.Name).Unwrap()
		if err != nil {
			return nil, err
		}
		log.Println("Field access authorization check result dump:")
		sharedUtils.Dump(fieldAccessAuthorizationCheckResult)
		if fieldAccessAuthorizationCheckResult.UserAuthorized {
			return next(ctx)
		}
		var errorMessage string
		if *fieldAccessAuthorizationCheckResult.AuthorizationDenialType == auth.Implicit {
			errorMessage = fmt.Sprintf("field access denied - user %d is not authorized (implicit authorization denial)", userID)
		} else {
			sourceOfExplicitAuthorizationDenial := *fieldAccessAuthorizationCheckResult.SourceOfExplicitAuthorizationDenial
			permissionID := sourceOfExplicitAuthorizationDenial.PermissionID
			roleIDs := sourceOfExplicitAuthorizationDenial.RoleIDs
			errorMessageDetail := fmt.Sprint("permission ", permissionID, " applied through roles ", roleIDs)
			errorMessage = fmt.Sprintf("field access denied - user %d is not authorized (explicit authorization denial - %s)", userID, errorMessageDetail)
		}
		graphql.AddError(ctx, &gqlerror.Error{
			Message:    errorMessage,
			Path:       graphql.GetPath(ctx),
			Extensions: map[string]any{"code": "UNAUTHORIZED"},
		})
		return nil, nil
	})
	router := chi.NewRouter()
	router.Use(cors.New(cors.Options{
		AllowedOrigins:   allowedOrigins.ToSlice(),
		AllowCredentials: true,
		Debug:            false,
	}).Handler)
	router.Handle("/", auth.JWTAuthenticationMiddleware(graphQLServer))
	router.Route("/auth", func(r chi.Router) {
		r.Use(NoCacheMiddleware)

		r.Get("/login", auth.LoginHandler)
		r.Get("/logout", auth.LogoutHandler)
		r.Get("/callback", auth.CallbackHandler)
	})
	log.Fatal(http.ListenAndServe(":9090", router))
}
