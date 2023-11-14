package dto2api

import (
	"bp-bures-SfPDfSD/src/api/graphql/model"
	"bp-bures-SfPDfSD/src/dto"
	"strconv"
)

func MapUserDefinedDeviceTypeDTOToUserDefinedDeviceType(userDefinedDeviceTypeDTO dto.UserDefinedDeviceTypeDTO) (*model.UserDefinedDeviceType, error) {

	userDefinedDeviceTypeParameters, err := mapDeviceTypeParameterDTOsToUserDefinedDeviceTypeParameters(userDefinedDeviceTypeDTO.Parameters)
	if err != nil {
		return nil, err
	}

	return &model.UserDefinedDeviceType{
		ID:         strconv.FormatUint(uint64(*userDefinedDeviceTypeDTO.ID), 10),
		Denotation: userDefinedDeviceTypeDTO.Denotation,
		Parameters: userDefinedDeviceTypeParameters,
	}, nil
}

func MapUserDefinedDeviceTypeDTOsToUserDefinedDeviceTypes(userDefinedDeviceTypeDTOs []dto.UserDefinedDeviceTypeDTO) ([]*model.UserDefinedDeviceType, error) {

	userDefinedDeviceTypes := make([]*model.UserDefinedDeviceType, len(userDefinedDeviceTypeDTOs))

	for index, userDefinedDeviceTypeDTO := range userDefinedDeviceTypeDTOs {
		userDefinedDeviceType, err := MapUserDefinedDeviceTypeDTOToUserDefinedDeviceType(userDefinedDeviceTypeDTO)
		if err != nil {
			return nil, err
		}
		userDefinedDeviceTypes[index] = userDefinedDeviceType
	}

	return userDefinedDeviceTypes, nil
}
