package db2dll

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

func ToDLLModelSDType(sdTypeEntity dbModel.SDTypeEntity) dllModel.SDType {
	return dllModel.SDType{
		ID:         sharedUtils.NewOptionalOf[uint32](sdTypeEntity.ID),
		Denotation: sdTypeEntity.Denotation,
		Label:      sharedUtils.NewOptionalOf[string](sdTypeEntity.Label),
		Icon:       sharedUtils.NewOptionalOf[string](sdTypeEntity.Icon),
		Parameters: sharedUtils.Map(sdTypeEntity.Parameters, func(sdParameterEntity dbModel.SDParameterEntity) dllModel.SDParameter {
			return dllModel.SDParameter{
				ID:         sharedUtils.NewOptionalOf[uint32](sdParameterEntity.ID),
				Denotation: sdParameterEntity.Denotation,
				Label:      sharedUtils.NewOptionalOf[string](sdParameterEntity.Label),
				Type: func(sdParameterType string) dllModel.SDParameterType {
					switch sdParameterType {
					case "string":
						return dllModel.SDParameterTypeString
					case "number":
						return dllModel.SDParameterTypeNumber
					case "boolean":
						return dllModel.SDParameterTypeTypeBoolean
					}
					panic(fmt.Errorf("unpexted model mapping failure – shouldn't happen"))
				}(sdParameterEntity.Type),
			}
		}),
	}
}
