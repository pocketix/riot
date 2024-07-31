package sharedUtils

import (
	"errors"
	"flag"
	"os"
)

// GetEnvironmentParameter returns the value of an environment parameter.
// If the parameter is provided as a command-line flag, it takes precedence.
// If neither the flag nor the environment variable is provided, it returns an error.
// Note: This function assumes that flag.Parse() has already been called to parse command-line flags.
func GetEnvironmentParameter(name, description string) (string, error) {
	// Check if command-line flag is provided
	flagValue := flag.String(name, "", description)

	// If command-line flag is provided, return its value
	if *flagValue != "" {
		return *flagValue, nil
	}

	// If no flag is provided, check environment variable
	envValue := os.Getenv(name)
	if envValue != "" {
		return envValue, nil
	}

	// If neither flag nor environment variable is provided, return an error
	return "", errors.New("Neither flag nor environment variable provided for " + name)
}
