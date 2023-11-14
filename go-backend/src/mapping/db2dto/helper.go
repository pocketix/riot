package db2dto

import (
	"bp-bures-SfPDfSD/src/dto"
	"bp-bures-SfPDfSD/src/persistence/rdb/schema"
	"errors"
)

func mapDeviceTypeParameterEntityTypeStringToUserDefinedDeviceTypeParameterDTOType(input string) (dto.UserDefinedDeviceTypeParameterType, error) {

	switch input {
	case "string", "STRING":
		return dto.UserDefinedDeviceTypeParameterTypeString, nil
	case "number", "NUMBER":
		return dto.UserDefinedDeviceTypeParameterTypeNumber, nil
	case "boolean", "BOOLEAN":
		return dto.UserDefinedDeviceTypeParameterTypeBoolean, nil
	default:
		return "", errors.New("invalid value – cannot map it to 'dto.UserDefinedDeviceTypeParameterType'")
	}
}

func mapDeviceTypeParameterEntityToUserDefinedDeviceTypeParameterDTO(deviceTypeParameterEntity schema.DeviceTypeParameterEntity) (*dto.UserDefinedDeviceTypeParameterDTO, error) {

	userDefinedDeviceTypeParameterDTOType, err := mapDeviceTypeParameterEntityTypeStringToUserDefinedDeviceTypeParameterDTOType(deviceTypeParameterEntity.Type)
	if err != nil {
		return nil, err
	}

	return &dto.UserDefinedDeviceTypeParameterDTO{
		ID:   &deviceTypeParameterEntity.ID,
		Name: deviceTypeParameterEntity.Name,
		Type: userDefinedDeviceTypeParameterDTOType,
	}, nil
}

func mapDeviceTypeParameterEntitiesToUserDefinedDeviceTypeParameterDTOs(deviceTypeParameterEntities []schema.DeviceTypeParameterEntity) ([]dto.UserDefinedDeviceTypeParameterDTO, error) {

	userDefinedDeviceTypeParameterDTOs := make([]dto.UserDefinedDeviceTypeParameterDTO, len(deviceTypeParameterEntities))

	for index, deviceTypeParameterEntity := range deviceTypeParameterEntities {
		userDefinedDeviceTypeParameterDTO, err := mapDeviceTypeParameterEntityToUserDefinedDeviceTypeParameterDTO(deviceTypeParameterEntity)
		if err != nil {
			return nil, err
		}
		userDefinedDeviceTypeParameterDTOs[index] = *userDefinedDeviceTypeParameterDTO
	}

	return userDefinedDeviceTypeParameterDTOs, nil
}
