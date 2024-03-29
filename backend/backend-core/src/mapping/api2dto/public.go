package api2dto

import (
	"bp-bures-SfPDfSD/src/api/graphql/model"
	"bp-bures-SfPDfSD/src/dto"
)

func MapNewDeviceTypeInputToDeviceTypeDTO(input model.NewDeviceTypeInput) dto.DeviceTypeDTO {

	deviceTypeDTOs := make([]dto.DeviceTypeParameterDTO, len(input.Parameters))

	for index, deviceTypeParameterInput := range input.Parameters {
		deviceTypeDTOs[index] = dto.DeviceTypeParameterDTO{
			Name: deviceTypeParameterInput.Name,
			Type: dto.DeviceTypeParameterType(deviceTypeParameterInput.Type),
		}
	}

	return dto.DeviceTypeDTO{
		ID:         nil,
		Denotation: input.Denotation,
		Parameters: deviceTypeDTOs,
	}
}
