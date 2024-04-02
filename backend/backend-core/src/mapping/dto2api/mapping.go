package dto2api

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/api/graphql/model"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/types"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func SDTypeDTOToSDType(sdTypeDto types.SDTypeDTO) *model.SDType {
	return &model.SDType{
		ID:         util.UINT32ToString(sdTypeDto.ID.GetPayload()),
		Denotation: sdTypeDto.Denotation,
		Parameters: util.Map(sdTypeDto.Parameters, func(sdParameterDto types.SDParameterDTO) *model.SDParameter {
			return &model.SDParameter{
				ID:         util.UINT32ToString(sdTypeDto.ID.GetPayload()),
				Denotation: sdParameterDto.Denotation,
				Type: func(sdParameterType types.SDParameterType) model.SDParameterType {
					switch sdParameterType {
					case types.SDParameterTypeString:
						return model.SDParameterTypeString
					case types.SDParameterTypeNumber:
						return model.SDParameterTypeNumber
					case types.SDParameterTypeTypeBoolean:
						return model.SDParameterTypeBoolean
					}
					panic("Mapping failed – should not happen...")
				}(sdParameterDto.Type),
			}
		}),
	}
}

func SDInstanceDTOToSDInstance(sdInstanceDTO types.SDInstanceDTO) *model.SDInstance {
	return &model.SDInstance{
		ID:              util.UINT32ToString(sdInstanceDTO.ID.GetPayload()),
		UID:             sdInstanceDTO.UID,
		ConfirmedByUser: sdInstanceDTO.ConfirmedByUser,
		UserIdentifier:  sdInstanceDTO.UserIdentifier,
		Type:            SDTypeDTOToSDType(sdInstanceDTO.SDType),
	}
}
