package api2dto

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/api/graphql/model"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/types"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func SDTypeInputToSDTypeDTO(sdTypeInput model.SDTypeInput) types.SDTypeDTO {
	return types.SDTypeDTO{
		ID:         util.NewEmptyOptional[uint32](),
		Denotation: sdTypeInput.Denotation,
		Parameters: util.Map(sdTypeInput.Parameters, func(sdParameterInput *model.SDParameterInput) types.SDParameterDTO {
			return types.SDParameterDTO{
				ID:         util.NewEmptyOptional[uint32](),
				Denotation: sdTypeInput.Denotation,
				Type: func(sdParameterType model.SDParameterType) types.SDParameterType {
					switch sdParameterType {
					case model.SDParameterTypeString:
						return types.SDParameterTypeString
					case model.SDParameterTypeNumber:
						return types.SDParameterTypeNumber
					case model.SDParameterTypeBoolean:
						return types.SDParameterTypeTypeBoolean
					}
					panic("Mapping failed – should not happen...")
				}(sdParameterInput.Type),
			}
		}),
	}
}
