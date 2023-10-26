package graphql

import (
	"github.com/gofiber/fiber/v2"
	"github.com/graphql-go/graphql"
	"log"
)

type input struct {
	Query         string                 `query:"query"`
	OperationName string                 `query:"operationName"`
	Variables     map[string]interface{} `query:"variables"`
}

func SetupGraphQLServer(app *fiber.App) {

	schema, err := SetupGraphQLSchema()
	if err != nil {
		log.Println("Failed to setup a GraphQL schema!")
		return
	}

	app.Get("/", func(ctx *fiber.Ctx) error {
		var i input
		if err := ctx.QueryParser(&i); err != nil {
			return ctx.
				Status(fiber.StatusInternalServerError).
				SendString("Cannot parse query parameters: " + err.Error())
		}

		result := graphql.Do(graphql.Params{
			Schema:         schema,
			RequestString:  i.Query,
			OperationName:  i.OperationName,
			VariableValues: i.Variables,
		})

		ctx.Set("Content-Type", "application/graphql-response+json")
		return ctx.JSON(result)
	})

	app.Post("/", func(ctx *fiber.Ctx) error {
		var i input
		if err := ctx.BodyParser(&i); err != nil {
			return ctx.
				Status(fiber.StatusInternalServerError).
				SendString("Cannot parse body: " + err.Error())
		}

		result := graphql.Do(graphql.Params{
			Schema:         schema,
			RequestString:  i.Query,
			OperationName:  i.OperationName,
			VariableValues: i.Variables,
		})

		ctx.Set("Content-Type", "application/graphql-response+json")
		return ctx.JSON(result)
	})

	log.Println("Finishing GraphQL server setup...")
}
