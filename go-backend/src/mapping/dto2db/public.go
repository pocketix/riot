package dto2db

import (
	"bp-bures-SfPDfSD/src/dto"
	"bp-bures-SfPDfSD/src/persistence/rdb/schema"
	"github.com/thoas/go-funk"
	"strings"
)

func MapDeviceDTOToDeviceEntity(d dto.DeviceDTO) schema.DeviceEntity {

	return schema.DeviceEntity{
		UID:  d.UID,
		Name: d.Name,
		DeviceType: schema.DeviceTypeEntity{
			ID:         *d.DeviceType.ID,
			Denotation: d.DeviceType.Denotation,
			Parameters: funk.Map(d.DeviceType.Parameters, func(d dto.DeviceTypeParameterDTO) schema.DeviceTypeParameterEntity {
				return schema.DeviceTypeParameterEntity{
					ID:   *d.ID,
					Name: d.Name,
					Type: strings.ToLower(string(d.Type)),
				}
			}).([]schema.DeviceTypeParameterEntity),
		},
	}
}
