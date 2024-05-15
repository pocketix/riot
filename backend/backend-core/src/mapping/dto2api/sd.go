package dto2api

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/types"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func SDTypeDTOToSDType(sdTypeDto types.SDTypeDTO) graphQLModel.SDType {
	return graphQLModel.SDType{
		ID:         sdTypeDto.ID.GetPayload(),
		Denotation: sdTypeDto.Denotation,
		Parameters: util.Map(sdTypeDto.Parameters, func(sdParameterDto types.SDParameterDTO) graphQLModel.SDParameter {
			return graphQLModel.SDParameter{
				ID:         sdParameterDto.ID.GetPayload(),
				Denotation: sdParameterDto.Denotation,
				Type: func(sdParameterType types.SDParameterType) graphQLModel.SDParameterType {
					switch sdParameterType {
					case types.SDParameterTypeString:
						return graphQLModel.SDParameterTypeString
					case types.SDParameterTypeNumber:
						return graphQLModel.SDParameterTypeNumber
					case types.SDParameterTypeTypeBoolean:
						return graphQLModel.SDParameterTypeBoolean
					}
					panic(fmt.Errorf("unpexted model mapping failure – shouldn't happen"))
				}(sdParameterDto.Type),
			}
		}),
	}
}

func SDInstanceDTOToSDInstance(sdInstanceDTO types.SDInstanceDTO) graphQLModel.SDInstance {
	return graphQLModel.SDInstance{
		ID:              sdInstanceDTO.ID.GetPayload(),
		UID:             sdInstanceDTO.UID,
		ConfirmedByUser: sdInstanceDTO.ConfirmedByUser,
		UserIdentifier:  sdInstanceDTO.UserIdentifier,
		Type:            SDTypeDTOToSDType(sdInstanceDTO.SDType),
	}
}
