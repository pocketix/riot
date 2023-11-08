package graphql

import (
	"bp-bures-SfPDfSD/src/api/graphql/model"
	rdb "bp-bures-SfPDfSD/src/persistence/relational-database"
	"errors"
	"strconv"
)

func mapDeviceTypeParameterEntityTypeStringToUserDefinedDeviceTypeParameterType(stringInput string) (model.UserDefinedDeviceTypeParameterType, error) {

	switch stringInput {
	case "string", "STRING":
		return model.UserDefinedDeviceTypeParameterTypeString, nil
	case "number", "NUMBER":
		return model.UserDefinedDeviceTypeParameterTypeNumber, nil
	case "boolean", "BOOLEAN":
		return model.UserDefinedDeviceTypeParameterTypeBoolean, nil
	default:
		return "", errors.New("invalid string value – cannot map it to 'model.UserDefinedDeviceTypeParameterType'")
	}
}

func mapDeviceTypeParameterEntityToUserDefinedDeviceTypeParameter(deviceTypeParameterEntity rdb.DeviceTypeParameterEntity) (*model.UserDefinedDeviceTypeParameter, error) {

	parameterType, err := mapDeviceTypeParameterEntityTypeStringToUserDefinedDeviceTypeParameterType(deviceTypeParameterEntity.Type)
	if err != nil {
		return nil, err
	}

	return &model.UserDefinedDeviceTypeParameter{
		ID:   strconv.FormatUint(uint64(deviceTypeParameterEntity.ID), 10),
		Name: deviceTypeParameterEntity.Name,
		Type: parameterType,
	}, nil
}

func mapDeviceTypeParameterEntitiesToUserDefinedDeviceTypeParameters(deviceTypeParameterEntities []rdb.DeviceTypeParameterEntity) ([]*model.UserDefinedDeviceTypeParameter, error) {

	userDefinedDeviceTypeParameters := make([]*model.UserDefinedDeviceTypeParameter, len(deviceTypeParameterEntities))

	for index, deviceTypeParameterEntity := range deviceTypeParameterEntities {
		userDefinedDeviceTypeParameter, err := mapDeviceTypeParameterEntityToUserDefinedDeviceTypeParameter(deviceTypeParameterEntity)
		if err != nil {
			return []*model.UserDefinedDeviceTypeParameter{}, err
		}
		userDefinedDeviceTypeParameters[index] = userDefinedDeviceTypeParameter
	}

	return userDefinedDeviceTypeParameters, nil
}
