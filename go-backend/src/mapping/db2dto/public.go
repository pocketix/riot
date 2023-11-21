package db2dto

import (
	"bp-bures-SfPDfSD/src/dto"
	"bp-bures-SfPDfSD/src/persistence/rdb/schema"
)

func MapUserDefinedDeviceTypeEntityToUserDefinedDeviceTypeDTO(userDefinedDeviceTypesEntity schema.UserDefinedDeviceTypeEntity) (*dto.UserDefinedDeviceTypeDTO, error) {

	userDefinedDeviceTypeParameterDTOs, err := mapDeviceTypeParameterEntitiesToUserDefinedDeviceTypeParameterDTOs(userDefinedDeviceTypesEntity.Parameters)
	if err != nil {
		return nil, err
	}

	return &dto.UserDefinedDeviceTypeDTO{
		ID:         &userDefinedDeviceTypesEntity.ID,
		Denotation: userDefinedDeviceTypesEntity.Denotation,
		Parameters: userDefinedDeviceTypeParameterDTOs,
	}, nil
}

func MapUserDefinedDeviceTypeEntitiesToUserDefinedDeviceTypeDTOs(userDefinedDeviceTypesEntities []schema.UserDefinedDeviceTypeEntity) ([]dto.UserDefinedDeviceTypeDTO, error) {

	userDefinedDeviceTypeDTOs := make([]dto.UserDefinedDeviceTypeDTO, len(userDefinedDeviceTypesEntities))

	for index, userDefinedDeviceTypesEntity := range userDefinedDeviceTypesEntities {
		userDefinedDeviceTypeDTO, err := MapUserDefinedDeviceTypeEntityToUserDefinedDeviceTypeDTO(userDefinedDeviceTypesEntity)
		if err != nil {
			return nil, err
		}
		userDefinedDeviceTypeDTOs[index] = *userDefinedDeviceTypeDTO
	}

	return userDefinedDeviceTypeDTOs, nil
}

func MapDeviceEntityToDeviceDTO(e schema.DeviceEntity) dto.DeviceDTO {

	userDefinedDeviceTypeDTO, _ := MapUserDefinedDeviceTypeEntityToUserDefinedDeviceTypeDTO(e.DeviceType) // TODO: Error handling...

	return dto.DeviceDTO{
		ID:         &e.ID,
		UID:        e.UID,
		Name:       e.Name,
		DeviceType: userDefinedDeviceTypeDTO,
	}
}
