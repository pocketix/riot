package graphql

import (
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/adaptor"
)

func SetupGraphQLServer(app *fiber.App) {

	graphQLServer := handler.NewDefaultServer(NewExecutableSchema(Config{Resolvers: &Resolver{}}))

	app.Use("/", adaptor.HTTPHandler(graphQLServer))
}
