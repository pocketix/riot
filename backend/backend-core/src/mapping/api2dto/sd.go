package api2dto

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/types"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func SDTypeInputToSDTypeDTO(sdTypeInput graphQLModel.SDTypeInput) types.SDTypeDTO {
	return types.SDTypeDTO{
		ID:         util.NewEmptyOptional[uint32](),
		Denotation: sdTypeInput.Denotation,
		Parameters: util.Map(sdTypeInput.Parameters, func(sdParameterInput graphQLModel.SDParameterInput) types.SDParameterDTO {
			return types.SDParameterDTO{
				ID:         util.NewEmptyOptional[uint32](),
				Denotation: sdParameterInput.Denotation,
				Type: func(sdParameterType graphQLModel.SDParameterType) types.SDParameterType {
					switch sdParameterType {
					case graphQLModel.SDParameterTypeString:
						return types.SDParameterTypeString
					case graphQLModel.SDParameterTypeNumber:
						return types.SDParameterTypeNumber
					case graphQLModel.SDParameterTypeBoolean:
						return types.SDParameterTypeTypeBoolean
					}
					panic(fmt.Errorf("unpexted model mapping failure – shouldn't happen"))
				}(sdParameterInput.Type),
			}
		}),
	}
}
