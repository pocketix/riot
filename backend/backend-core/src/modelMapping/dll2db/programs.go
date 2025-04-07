package dll2db

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

func ToDBModelEntityVPLProgram(vplProgram dllModel.VPLProgram) dbModel.VPLProgramsEntity {
	return dbModel.VPLProgramsEntity{
		ID:   vplProgram.ID,
		Name: vplProgram.Name,
		Data: vplProgram.Data,
		ReferencedValues: sharedUtils.Map(vplProgram.ReferencedValues, func(referencedValue dllModel.ReferencedValue) dbModel.VPLReferencedValuesEntity {
			return dbModel.VPLReferencedValuesEntity{
				ID:        referencedValue.ID,
				DeviceID:  referencedValue.DeviceID,
				Parameter: referencedValue.Parameter,
			}
		}),
	}
}
