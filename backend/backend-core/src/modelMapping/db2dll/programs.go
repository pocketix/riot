package db2dll

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

func ToDLLModelVplProgram(entity dbModel.VPLProgramsEntity) dllModel.VPLProgram {
	return dllModel.VPLProgram{
		ID:   entity.ID,
		Name: entity.Name,
		Data: entity.Data,
		ReferencedValues: sharedUtils.Map(entity.ReferencedValues, func(vplReferencedValue dbModel.VPLReferencedValuesEntity) dllModel.ReferencedValue {
			return dllModel.ReferencedValue{
				ID:        vplReferencedValue.ID,
				DeviceID:  vplReferencedValue.DeviceID,
				Parameter: vplReferencedValue.Parameter,
			}
		}),
	}
}
