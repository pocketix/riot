package dll2db

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

func ToDBModelEntityVPLProgram(vplProgram dllModel.VPLProgram) dbModel.VPLProgramsEntity {
	return dbModel.VPLProgramsEntity{
		ID:      vplProgram.ID,
		Name:    vplProgram.Name,
		Data:    vplProgram.Data,
		LastRun: vplProgram.LastRun,
		Enabled: vplProgram.Enabled,
		SDParameterSnapshots: sharedUtils.Map(vplProgram.SDParameterSnapshots, func(link dllModel.VPLProgramSDSnapshotLink) dbModel.VPLProgramSDSnapshotLinkEntity {
			return dbModel.VPLProgramSDSnapshotLinkEntity{
				ProgramID:     link.ProgramID,
				SDInstanceID:  link.InstanceID,
				SDParameterID: link.ParameterID,
			}
		}),
	}
}
