package main

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {

	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:1234",
	}))

	app.Get("/run-demo", func(c *fiber.Ctx) error {
		go runDemo()
		return c.SendString("One should be able to run the DEMO in asynchronous manner by accessing this REST endpoint...")
	})

	app.Get("/fetch-data", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "Hello from Go back-end!",
		})
	})

	err := app.Listen("localhost:8080")
	if err != nil {
		return
	}
}
