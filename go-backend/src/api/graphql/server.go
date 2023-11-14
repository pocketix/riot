package graphql

import (
	"bp-bures-SfPDfSD/src/api/graphql/generated"
	"bp-bures-SfPDfSD/src/persistence/rdb"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/adaptor"
)

func SetupGraphQLServer(app *fiber.App, rdbClient rdb.RelationalDatabaseClient) {

	graphQLServer := handler.NewDefaultServer(generated.NewExecutableSchema(generated.Config{Resolvers: &Resolver{
		rdbClient: rdbClient,
	}}))

	app.Use("/", adaptor.HTTPHandler(graphQLServer))
}
