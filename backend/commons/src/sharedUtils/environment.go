package sharedUtils

import (
	"log"
	"os"
	"strconv"
)

func GetEnvironmentVariableValue(environmentVariableName string) Optional[string] {
	environmentVariableValue, isSet := os.LookupEnv(environmentVariableName)
	if !isSet {
		log.Printf("Warning: Environment variable '%s' is not set\n", environmentVariableName)
		return NewEmptyOptional[string]()
	}
	return NewOptionalOf(environmentVariableValue)
}

// GetFlagEnvironmentVariableValue is a utility function designed to yield the boolean value of 'flag' environment variables in
// the most sensible manner.:
//
// 1. The environment variable is not present: signal missing value and delegate the decision to upper layer.
//
// 2. The environment variable is present, but has no value: return 'true', considering the nature 'flag' variables.
//
// 3. The environment variable is present and has a value which can be interpreted as a boolean ('1', 't', 'T', 'TRUE', 'true', 'True', '0', 'f', 'F', 'FALSE', 'false' and 'False'): return the boolean
// representation of the said value.
//
// 4. The environment variable is present and has a value which cannot be interpreted as a boolean: signal missing value and delegate the decision to upper layer.
func GetFlagEnvironmentVariableValue(environmentVariableName string) Optional[bool] {
	environmentVariableValueOptional := GetEnvironmentVariableValue(environmentVariableName)
	if environmentVariableValueOptional.IsEmpty() {
		return NewEmptyOptional[bool]()
	}
	environmentVariableValue := environmentVariableValueOptional.GetPayload()
	if environmentVariableValue == "" {
		return NewOptionalOf(true)
	}
	booleanResult, err := strconv.ParseBool(environmentVariableValue)
	if err != nil {
		log.Printf("Warning: Environment variable '%s' is set and has a value, but this value — '%s' — cannot be interpreted as a boolean!\n", environmentVariableName, environmentVariableValue)
		return NewEmptyOptional[bool]()
	}
	return NewOptionalOf(booleanResult)
}
