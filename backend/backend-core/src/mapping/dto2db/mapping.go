package dto2db

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/schema"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/types"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func SDTypeDTOToSDTypeEntity(sdTypeDTO types.SDTypeDTO) schema.SDTypeEntity {
	return schema.SDTypeEntity{
		Denotation: sdTypeDTO.Denotation,
		Parameters: util.Map(sdTypeDTO.Parameters, func(sdParameterDTO types.SDParameterDTO) schema.SDParameterEntity {
			return schema.SDParameterEntity{
				Denotation: sdParameterDTO.Denotation,
				Type:       string(sdParameterDTO.Type),
			}
		}),
	}
}
