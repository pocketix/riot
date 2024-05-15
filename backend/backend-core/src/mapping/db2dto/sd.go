package db2dto

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/dbSchema"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/types"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func SDTypeEntityToSDTypeDTO(sdTypeEntity dbSchema.SDTypeEntity) types.SDTypeDTO {
	return types.SDTypeDTO{
		ID:         util.NewOptionalOf[uint32](sdTypeEntity.ID),
		Denotation: sdTypeEntity.Denotation,
		Parameters: util.Map(sdTypeEntity.Parameters, func(sdParameterEntity dbSchema.SDParameterEntity) types.SDParameterDTO {
			return types.SDParameterDTO{
				ID:         util.NewOptionalOf[uint32](sdParameterEntity.ID),
				Denotation: sdParameterEntity.Denotation,
				Type: func(sdParameterType string) types.SDParameterType {
					switch sdParameterType {
					case "string":
						return types.SDParameterTypeString
					case "number":
						return types.SDParameterTypeNumber
					case "boolean":
						return types.SDParameterTypeTypeBoolean
					}
					panic(fmt.Errorf("unpexted model mapping failure – shouldn't happen"))
				}(sdParameterEntity.Type),
			}
		}),
	}
}

func SDInstanceEntityToSDInstanceDTO(sdInstanceEntity dbSchema.SDInstanceEntity) types.SDInstanceDTO {
	return types.SDInstanceDTO{
		ID:              util.NewOptionalOf[uint32](sdInstanceEntity.ID),
		UID:             sdInstanceEntity.UID,
		ConfirmedByUser: sdInstanceEntity.ConfirmedByUser,
		UserIdentifier:  sdInstanceEntity.UserIdentifier,
		SDType:          SDTypeEntityToSDTypeDTO(sdInstanceEntity.SDType),
	}
}
