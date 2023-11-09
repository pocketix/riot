package graphql

import (
	"bp-bures-SfPDfSD/src/api/graphql/model"
	"bp-bures-SfPDfSD/src/dto"
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
			return nil, err
		}
		userDefinedDeviceTypeParameters[index] = userDefinedDeviceTypeParameter
	}

	return userDefinedDeviceTypeParameters, nil
}

func mapUserDefinedDeviceTypeEntityToUserDefinedDeviceType(userDefinedDeviceTypeEntity rdb.UserDefinedDeviceTypeEntity) (*model.UserDefinedDeviceType, error) {

	userDefinedDeviceTypeParameters, err := mapDeviceTypeParameterEntitiesToUserDefinedDeviceTypeParameters(userDefinedDeviceTypeEntity.Parameters)
	if err != nil {
		return nil, err
	}

	return &model.UserDefinedDeviceType{
		ID:         strconv.FormatUint(uint64(userDefinedDeviceTypeEntity.ID), 10),
		Denotation: userDefinedDeviceTypeEntity.Denotation,
		Parameters: userDefinedDeviceTypeParameters,
	}, nil
}

func mapUserDefinedDeviceTypeEntitiesToUserDefinedDeviceTypes(userDefinedDeviceTypeEntities []rdb.UserDefinedDeviceTypeEntity) ([]*model.UserDefinedDeviceType, error) {

	userDefinedDeviceTypes := make([]*model.UserDefinedDeviceType, len(userDefinedDeviceTypeEntities))

	for index, userDefinedDeviceTypeEntity := range userDefinedDeviceTypeEntities {
		userDefinedDeviceType, err := mapUserDefinedDeviceTypeEntityToUserDefinedDeviceType(userDefinedDeviceTypeEntity)
		if err != nil {
			return nil, err
		}
		userDefinedDeviceTypes[index] = userDefinedDeviceType
	}

	return userDefinedDeviceTypes, nil
}

func mapNewUserDefinedDeviceTypeInputToUserDefinedDeviceTypeDTO(input model.NewUserDefinedDeviceTypeInput) dto.UserDefinedDeviceTypeDTO {

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
