package dto2api

import (
	"bp-bures-SfPDfSD/src/api/graphql/model"
	"bp-bures-SfPDfSD/src/dto"
	"bp-bures-SfPDfSD/src/util"
	"github.com/thoas/go-funk"
	"strconv"
)

func MapDeviceTypeDTOToDeviceType(deviceTypeDTO dto.DeviceTypeDTO) (*model.DeviceType, error) {

	deviceTypeParameters, err := mapDeviceTypeParameterDTOsToDeviceTypeParameters(deviceTypeDTO.Parameters)
	if err != nil {
		return nil, err
	}

	return &model.DeviceType{
		ID:         strconv.FormatUint(uint64(*deviceTypeDTO.ID), 10),
		Denotation: deviceTypeDTO.Denotation,
		Parameters: deviceTypeParameters,
	}, nil
}

func MapDeviceTypeDTOsToDeviceTypes(DeviceTypeDTOs []dto.DeviceTypeDTO) ([]*model.DeviceType, error) { // TODO: Example of go-funk code-style along with error handling...

	results := funk.Map(DeviceTypeDTOs, func(u dto.DeviceTypeDTO) util.ValueOrError {
		res, err := MapDeviceTypeDTOToDeviceType(u)
		return util.ValueOrError{
			Value: res,
			Error: err,
		}
	}).([]util.ValueOrError)

	errElem := funk.Find(results, func(r util.ValueOrError) bool { return r.Error != nil })
	if errElem != nil {
		return nil, errElem.(util.ValueOrError).Error
	}

	return funk.Map(results, func(r util.ValueOrError) *model.DeviceType {
		return r.Value.(*model.DeviceType)
	}).([]*model.DeviceType), nil
}

func MapDeviceDTOToDevice(deviceDTO dto.DeviceDTO) *model.Device {

	deviceType, _ := MapDeviceTypeDTOToDeviceType(*deviceDTO.DeviceType) // TODO: Error handling... but error occurrence here is improbable...

	return &model.Device{
		ID:   strconv.FormatUint(uint64(*deviceDTO.ID), 10),
		UID:  deviceDTO.UID,
		Name: deviceDTO.Name,
		Type: deviceType,
	}
}
