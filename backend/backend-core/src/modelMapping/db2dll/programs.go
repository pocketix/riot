package db2dll

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

func ToDLLModelVplProgram(entity dbModel.VPLProgramsEntity) dllModel.VPLProgram {
	return dllModel.VPLProgram{
		ID:      entity.ID,
		Name:    entity.Name,
		Data:    entity.Data,
		LastRun: entity.LastRun,
		Enabled: entity.Enabled,
		SDParameterSnapshots: sharedUtils.Map(entity.SDParameterSnapshots, func(link dbModel.VPLProgramSDSnapshotLinkEntity) dllModel.VPLProgramSDSnapshotLink {
			return dllModel.VPLProgramSDSnapshotLink{
				ProgramID:   link.ProgramID,
				InstanceID:  link.SDInstanceID,
				ParameterID: link.SDParameterID,
			}
		}),
	}
}
