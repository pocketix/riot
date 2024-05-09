package dto2db

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/schema"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/types"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func SDTypeDTOToSDTypeEntity(sdTypeDTO types.SDTypeDTO) schema.SDTypeEntity {
	return schema.SDTypeEntity{
		ID:         sdTypeDTO.ID.GetPayloadOrDefault(0),
		Denotation: sdTypeDTO.Denotation,
		Parameters: util.Map(sdTypeDTO.Parameters, func(sdParameterDTO types.SDParameterDTO) schema.SDParameterEntity {
			return schema.SDParameterEntity{
				ID:         sdParameterDTO.ID.GetPayloadOrDefault(0),
				Denotation: sdParameterDTO.Denotation,
				Type:       string(sdParameterDTO.Type),
			}
		}),
	}
}

func SDInstanceDTOToSDInstanceEntity(sdInstanceDTO types.SDInstanceDTO) schema.SDInstanceEntity {
	return schema.SDInstanceEntity{
		ID:              sdInstanceDTO.ID.GetPayloadOrDefault(0),
		UID:             sdInstanceDTO.UID,
		ConfirmedByUser: sdInstanceDTO.ConfirmedByUser,
		UserIdentifier:  sdInstanceDTO.UserIdentifier,
		SDTypeID:        sdInstanceDTO.SDType.ID.GetPayloadOrDefault(0),
	}
}
