package gql2dll

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func ToDLLModelSDType(sdTypeInput graphQLModel.SDTypeInput) dllModel.SDType {
	return dllModel.SDType{
		ID:         util.NewEmptyOptional[uint32](),
		Denotation: sdTypeInput.Denotation,
		Parameters: util.Map(sdTypeInput.Parameters, func(sdParameterInput graphQLModel.SDParameterInput) dllModel.SDParameter {
			return dllModel.SDParameter{
				ID:         util.NewEmptyOptional[uint32](),
				Denotation: sdParameterInput.Denotation,
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
