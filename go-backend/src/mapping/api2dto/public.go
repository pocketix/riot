package api2dto

import (
	"bp-bures-SfPDfSD/src/api/graphql/model"
	"bp-bures-SfPDfSD/src/dto"
)

func MapNewUserDefinedDeviceTypeInputToUserDefinedDeviceTypeDTO(input model.NewUserDefinedDeviceTypeInput) dto.UserDefinedDeviceTypeDTO {

	userDefinedDeviceTypeDTOs := make([]dto.UserDefinedDeviceTypeParameterDTO, len(input.Parameters))

	for index, userDefinedDeviceTypeParameterInput := range input.Parameters {
		userDefinedDeviceTypeDTOs[index] = dto.UserDefinedDeviceTypeParameterDTO{
			Name: userDefinedDeviceTypeParameterInput.Name,
			Type: dto.UserDefinedDeviceTypeParameterType(userDefinedDeviceTypeParameterInput.Type),
		}
	}

	return dto.UserDefinedDeviceTypeDTO{
		ID:         nil,
		Denotation: input.Denotation,
		Parameters: userDefinedDeviceTypeDTOs,
	}
}
