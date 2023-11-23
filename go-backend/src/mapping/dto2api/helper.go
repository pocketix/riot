package dto2api

import (
	"bp-bures-SfPDfSD/src/api/graphql/model"
	"bp-bures-SfPDfSD/src/dto"
	"errors"
	"strconv"
)

func mapDeviceTypeParameterTypes(DeviceTypeParameterType dto.DeviceTypeParameterType) (model.DeviceTypeParameterType, error) {

	switch DeviceTypeParameterType {
	case dto.DeviceTypeParameterTypeString:
		return model.DeviceTypeParameterTypeString, nil
	case dto.DeviceTypeParameterTypeNumber:
		return model.DeviceTypeParameterTypeNumber, nil
	case dto.DeviceTypeParameterTypeBoolean:
		return model.DeviceTypeParameterTypeBoolean, nil
	default:
		return "", errors.New("invalid value – cannot map it to 'model.DeviceTypeParameterType'")
	}
}

func mapDeviceTypeParameterEntityToDeviceTypeParameter(deviceTypeParameterDTO dto.DeviceTypeParameterDTO) (*model.DeviceTypeParameter, error) {

	parameterType, err := mapDeviceTypeParameterTypes(deviceTypeParameterDTO.Type)
	if err != nil {
		return nil, err
	}

	return &model.DeviceTypeParameter{
		ID:   strconv.FormatUint(uint64(*deviceTypeParameterDTO.ID), 10),
		Name: deviceTypeParameterDTO.Name,
		Type: parameterType,
	}, nil
}

func mapDeviceTypeParameterDTOsToDeviceTypeParameters(deviceTypeParameterDTOs []dto.DeviceTypeParameterDTO) ([]*model.DeviceTypeParameter, error) {

	deviceTypeParameters := make([]*model.DeviceTypeParameter, len(deviceTypeParameterDTOs))

	for index, deviceTypeParameterDTO := range deviceTypeParameterDTOs {
		deviceTypeParameter, err := mapDeviceTypeParameterEntityToDeviceTypeParameter(deviceTypeParameterDTO)
		if err != nil {
			return nil, err
		}
		deviceTypeParameters[index] = deviceTypeParameter
	}

	return deviceTypeParameters, nil
}
