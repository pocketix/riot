package main

import "github.com/gofiber/fiber/v2"

func main() {
	app := fiber.New()

	app.Get("/run-demo", func(c *fiber.Ctx) error {
		go runDemo()
		return c.SendString("One should be able to run the DEMO in asynchronous manner by accessing this REST endpoint...")
	})

	err := app.Listen("localhost:8080")
	if err != nil {
		return
	}
}
