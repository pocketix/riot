package gql2dll

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

func ToDLLModelSDType(sdTypeInput graphQLModel.SDTypeInput) dllModel.SDType {
	return dllModel.SDType{
		ID:         sharedUtils.NewEmptyOptional[uint32](),
		Denotation: sdTypeInput.Denotation,
		Label:      sharedUtils.NewOptionalFromPointer[string](sdTypeInput.Label),
		Icon:       sharedUtils.NewOptionalFromPointer[string](sdTypeInput.Icon),
		Parameters: sharedUtils.Map(sdTypeInput.Parameters, func(sdParameterInput graphQLModel.SDParameterInput) dllModel.SDParameter {
			return dllModel.SDParameter{
				ID:         sharedUtils.NewEmptyOptional[uint32](),
				Denotation: sdParameterInput.Denotation,
				Label:      sharedUtils.NewOptionalFromPointer[string](sdParameterInput.Label),
				Type: func(sdParameterType graphQLModel.SDParameterType) dllModel.SDParameterType {
					switch sdParameterType {
					case graphQLModel.SDParameterTypeString:
						return dllModel.SDParameterTypeString
					case graphQLModel.SDParameterTypeNumber:
						return dllModel.SDParameterTypeNumber
					case graphQLModel.SDParameterTypeBoolean:
						return dllModel.SDParameterTypeTypeBoolean
					}
					panic(fmt.Errorf("unpexted model mapping failure – shouldn't happen"))
				}(sdParameterInput.Type),
			}
		}),
	}
}
