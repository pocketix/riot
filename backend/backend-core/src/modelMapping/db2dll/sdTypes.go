package db2dll

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func ToDLLModelSDType(sdTypeEntity dbModel.SDTypeEntity) dllModel.SDType {
	return dllModel.SDType{
		ID:         util.NewOptionalOf[uint32](sdTypeEntity.ID),
		Denotation: sdTypeEntity.Denotation,
		Parameters: util.Map(sdTypeEntity.Parameters, func(sdParameterEntity dbModel.SDParameterEntity) dllModel.SDParameter {
			return dllModel.SDParameter{
				ID:         util.NewOptionalOf[uint32](sdParameterEntity.ID),
				Denotation: sdParameterEntity.Denotation,
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
