package graphql

import (
	"bp-bures-SfPDfSD/src/persistence/relational-database"
	"errors"
	"github.com/graphql-go/graphql"
	"strconv"
)

func serializeDeviceTypeParameters(deviceTypeParameters []relational_database.DeviceTypeParameterEntity) []map[string]interface{} {

	serializedDeviceTypeParameters := make([]map[string]interface{}, len(deviceTypeParameters))

	for index, deviceTypeParameter := range deviceTypeParameters {
		serializedDeviceTypeParameters[index] = map[string]interface{}{
			"id":   strconv.FormatUint(uint64(deviceTypeParameter.ID), 10),
			"name": deviceTypeParameter.Name,
			"type": deviceTypeParameter.Type,
		}
	}

	return serializedDeviceTypeParameters
}

func GetSingleUserDefinedDeviceTypeQueryResolverFunction(p graphql.ResolveParams) (interface{}, error) {

	var err error

	relationalDatabaseClient, _ := relational_database.GetRelationalDatabaseClient()

	idAsString, ok := p.Args["id"].(string)
	if !ok {
		return nil, errors.New("id argument is either missing or is not a string")
	}

	var u64ID uint64
	u64ID, err = strconv.ParseUint(idAsString, 10, 32)
	if err != nil {
		return nil, err
	}
	u32ID := uint32(u64ID)

	var userDefinedDeviceType relational_database.UserDefinedDeviceTypeEntity
	userDefinedDeviceType, err = relationalDatabaseClient.ObtainUserDefinedDeviceTypeByID(u32ID)

	return map[string]interface{}{
		"id":         idAsString,
		"denotation": userDefinedDeviceType.Denotation,
		"parameters": serializeDeviceTypeParameters(userDefinedDeviceType.Parameters),
	}, err
}

func GetUserDefinedDeviceTypesQueryResolverFunction(_ graphql.ResolveParams) (interface{}, error) {

	relationalDatabaseClient, _ := relational_database.GetRelationalDatabaseClient()

	userDefinedDeviceTypes, err := relationalDatabaseClient.ObtainAllUserDefinedDeviceTypes()
	if err != nil {
		return nil, err
	}

	var results []map[string]interface{}

	for _, userDefinedDeviceType := range userDefinedDeviceTypes {
		results = append(results, map[string]interface{}{
			"id":         strconv.FormatUint(uint64(userDefinedDeviceType.ID), 10),
			"denotation": userDefinedDeviceType.Denotation,
			"parameters": serializeDeviceTypeParameters(userDefinedDeviceType.Parameters),
		})
	}

	return results, nil
}
