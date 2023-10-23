package main

import (
	"errors"
	"fmt"
	"github.com/graphql-go/graphql"
	"strconv"
)

func SingleUserDefinedDeviceTypeQueryResolverFunction(p graphql.ResolveParams) (interface{}, error) {

	idAsString, ok := p.Args["id"].(string)
	if !ok {
		return nil, errors.New("id argument is either missing or is not a string")
	}

	u64ID, err := strconv.ParseUint(idAsString, 10, 32)
	if err != nil {
		fmt.Println("Error:", err)
		return nil, err
	}
	u32ID := uint32(u64ID)

	userDefinedDeviceType, err := relationalDatabaseClient.ObtainUserDefinedDeviceTypeByID(u32ID)

	parameters := make([]map[string]interface{}, len(userDefinedDeviceType.Parameters))
	for parameterIndex, parameter := range userDefinedDeviceType.Parameters {
		parameters[parameterIndex] = map[string]interface{}{
			"id":   strconv.FormatUint(uint64(parameter.ID), 10),
			"name": parameter.Name,
			"type": parameter.Type,
		}
	}

	return map[string]interface{}{
		"id":         idAsString,
		"denotation": userDefinedDeviceType.Denotation,
		"parameters": parameters,
	}, nil
}
