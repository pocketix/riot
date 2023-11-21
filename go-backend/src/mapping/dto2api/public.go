package dto2api

import (
	"bp-bures-SfPDfSD/src/api/graphql/model"
	"bp-bures-SfPDfSD/src/dto"
	"bp-bures-SfPDfSD/src/util"
	"github.com/thoas/go-funk"
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

func MapUserDefinedDeviceTypeDTOsToUserDefinedDeviceTypes(userDefinedDeviceTypeDTOs []dto.UserDefinedDeviceTypeDTO) ([]*model.UserDefinedDeviceType, error) { // TODO: Example of go-funk code-style along with error handling...

	results := funk.Map(userDefinedDeviceTypeDTOs, func(u dto.UserDefinedDeviceTypeDTO) util.ValueOrError {
		res, err := MapUserDefinedDeviceTypeDTOToUserDefinedDeviceType(u)
		return util.ValueOrError{
			Value: res,
			Error: err,
		}
	}).([]util.ValueOrError)

	errElem := funk.Find(results, func(r util.ValueOrError) bool { return r.Error != nil })
	if errElem != nil {
		return nil, errElem.(util.ValueOrError).Error
	}

	return funk.Map(results, func(r util.ValueOrError) *model.UserDefinedDeviceType {
		return r.Value.(*model.UserDefinedDeviceType)
	}).([]*model.UserDefinedDeviceType), nil
}

func MapDeviceDTOToDevice(deviceDTO dto.DeviceDTO) *model.Device {

	userDefinedDeviceType, _ := MapUserDefinedDeviceTypeDTOToUserDefinedDeviceType(*deviceDTO.DeviceType) // TODO: Error handling... but error occurrence here is improbable...

	return &model.Device{
		ID:   strconv.FormatUint(uint64(*deviceDTO.ID), 10),
		UID:  deviceDTO.UID,
		Name: deviceDTO.Name,
		Type: userDefinedDeviceType,
	}
}
