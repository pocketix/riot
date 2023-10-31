package graphql

import (
	"bp-bures-SfPDfSD/src/api/graphql/generated"
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/adaptor"
)

func SetupGraphQLServer(app *fiber.App) {

	graphQLServer := handler.NewDefaultServer(generated.NewExecutableSchema(generated.Config{Resolvers: &Resolver{}}))

	app.Use("/", adaptor.HTTPHandler(graphQLServer))
}
