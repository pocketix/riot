package sharedUtils

import (
	"log"
	"os"
)

func GetEnvironmentVariableValue(environmentVariableName string) Optional[string] {
	environmentVariableContents, isSet := os.LookupEnv(environmentVariableName)
	if !isSet {
		log.Printf("Warning: Environment variable %s is not set\n", environmentVariableName)
		return NewEmptyOptional[string]()
	}
	return NewOptionalOf(environmentVariableContents)
}
