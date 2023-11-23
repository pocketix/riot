package db2dto

import (
	"bp-bures-SfPDfSD/src/dto"
	"bp-bures-SfPDfSD/src/persistence/rdb/schema"
	"errors"
)

func mapDeviceTypeParameterEntityTypeStringToDeviceTypeParameterDTOType(input string) (dto.DeviceTypeParameterType, error) {

	switch input {
	case "string", "STRING":
		return dto.DeviceTypeParameterTypeString, nil
	case "number", "NUMBER":
		return dto.DeviceTypeParameterTypeNumber, nil
	case "boolean", "BOOLEAN":
		return dto.DeviceTypeParameterTypeBoolean, nil
	default:
		return "", errors.New("invalid value – cannot map it to 'dto.DeviceTypeParameterType'")
	}
}

func mapDeviceTypeParameterEntityToDeviceTypeParameterDTO(deviceTypeParameterEntity schema.DeviceTypeParameterEntity) (*dto.DeviceTypeParameterDTO, error) {

	deviceTypeParameterDTOType, err := mapDeviceTypeParameterEntityTypeStringToDeviceTypeParameterDTOType(deviceTypeParameterEntity.Type)
	if err != nil {
		return nil, err
	}

	return &dto.DeviceTypeParameterDTO{
		ID:   &deviceTypeParameterEntity.ID,
		Name: deviceTypeParameterEntity.Name,
		Type: deviceTypeParameterDTOType,
	}, nil
}

func mapDeviceTypeParameterEntitiesToDeviceTypeParameterDTOs(deviceTypeParameterEntities []schema.DeviceTypeParameterEntity) ([]dto.DeviceTypeParameterDTO, error) {

	deviceTypeParameterDTOs := make([]dto.DeviceTypeParameterDTO, len(deviceTypeParameterEntities))

	for index, deviceTypeParameterEntity := range deviceTypeParameterEntities {
		deviceTypeParameterDTO, err := mapDeviceTypeParameterEntityToDeviceTypeParameterDTO(deviceTypeParameterEntity)
		if err != nil {
			return nil, err
		}
		deviceTypeParameterDTOs[index] = *deviceTypeParameterDTO
	}

	return deviceTypeParameterDTOs, nil
}
