package dto2api

import (
	"bp-bures-SfPDfSD/src/api/graphql/model"
	"bp-bures-SfPDfSD/src/dto"
	"errors"
	"strconv"
)

func mapUserDefinedDeviceTypeParameterTypes(userDefinedDeviceTypeParameterType dto.UserDefinedDeviceTypeParameterType) (model.UserDefinedDeviceTypeParameterType, error) {

	switch userDefinedDeviceTypeParameterType {
	case dto.UserDefinedDeviceTypeParameterTypeString:
		return model.UserDefinedDeviceTypeParameterTypeString, nil
	case dto.UserDefinedDeviceTypeParameterTypeNumber:
		return model.UserDefinedDeviceTypeParameterTypeNumber, nil
	case dto.UserDefinedDeviceTypeParameterTypeBoolean:
		return model.UserDefinedDeviceTypeParameterTypeBoolean, nil
	default:
		return "", errors.New("invalid value – cannot map it to 'model.UserDefinedDeviceTypeParameterType'")
	}
}

func mapDeviceTypeParameterEntityToUserDefinedDeviceTypeParameter(deviceTypeParameterDTO dto.UserDefinedDeviceTypeParameterDTO) (*model.UserDefinedDeviceTypeParameter, error) {

	parameterType, err := mapUserDefinedDeviceTypeParameterTypes(deviceTypeParameterDTO.Type)
	if err != nil {
		return nil, err
	}

	return &model.UserDefinedDeviceTypeParameter{
		ID:   strconv.FormatUint(uint64(*deviceTypeParameterDTO.ID), 10),
		Name: deviceTypeParameterDTO.Name,
		Type: parameterType,
	}, nil
}

func mapDeviceTypeParameterDTOsToUserDefinedDeviceTypeParameters(deviceTypeParameterDTOs []dto.UserDefinedDeviceTypeParameterDTO) ([]*model.UserDefinedDeviceTypeParameter, error) {

	userDefinedDeviceTypeParameters := make([]*model.UserDefinedDeviceTypeParameter, len(deviceTypeParameterDTOs))

	for index, deviceTypeParameterDTO := range deviceTypeParameterDTOs {
		userDefinedDeviceTypeParameter, err := mapDeviceTypeParameterEntityToUserDefinedDeviceTypeParameter(deviceTypeParameterDTO)
		if err != nil {
			return nil, err
		}
		userDefinedDeviceTypeParameters[index] = userDefinedDeviceTypeParameter
	}

	return userDefinedDeviceTypeParameters, nil
}
