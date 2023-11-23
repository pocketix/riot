package db2dto

import (
	"bp-bures-SfPDfSD/src/dto"
	"bp-bures-SfPDfSD/src/persistence/rdb/schema"
)

func MapDeviceTypeEntityToDeviceTypeDTO(deviceTypeEntity schema.DeviceTypeEntity) (*dto.DeviceTypeDTO, error) {

	deviceTypeParameterDTOs, err := mapDeviceTypeParameterEntitiesToDeviceTypeParameterDTOs(deviceTypeEntity.Parameters)
	if err != nil {
		return nil, err
	}

	return &dto.DeviceTypeDTO{
		ID:         &deviceTypeEntity.ID,
		Denotation: deviceTypeEntity.Denotation,
		Parameters: deviceTypeParameterDTOs,
	}, nil
}

func MapDeviceTypeEntitiesToDeviceTypeDTOs(deviceTypeEntities []schema.DeviceTypeEntity) ([]dto.DeviceTypeDTO, error) {

	deviceTypeDTOs := make([]dto.DeviceTypeDTO, len(deviceTypeEntities))

	for index, deviceTypeEntity := range deviceTypeEntities {
		deviceTypeDTO, err := MapDeviceTypeEntityToDeviceTypeDTO(deviceTypeEntity)
		if err != nil {
			return nil, err
		}
		deviceTypeDTOs[index] = *deviceTypeDTO
	}

	return deviceTypeDTOs, nil
}

func MapDeviceEntityToDeviceDTO(deviceEntity schema.DeviceEntity) dto.DeviceDTO {

	deviceTypeDTO, _ := MapDeviceTypeEntityToDeviceTypeDTO(deviceEntity.DeviceType) // TODO: Error handling...

	return dto.DeviceDTO{
		ID:         &deviceEntity.ID,
		UID:        deviceEntity.UID,
		Name:       deviceEntity.Name,
		DeviceType: deviceTypeDTO,
	}
}
