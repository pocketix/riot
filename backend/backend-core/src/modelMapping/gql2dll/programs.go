package gql2dll

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

func ToDLLModelVPLProgram(vplProgram graphQLModel.VPLProgram) dllModel.VPLProgram {
	return dllModel.VPLProgram{
		ID:      vplProgram.ID,
		Name:    vplProgram.Name,
		Data:    vplProgram.Data,
		LastRun: vplProgram.LastRun,
		Enabled: vplProgram.Enabled,
		SDParameterSnapshots: sharedUtils.Map(vplProgram.SdParameterSnapshots, func(link graphQLModel.SDParameterSnapshot) dllModel.VPLProgramSDSnapshotLink {
			return dllModel.VPLProgramSDSnapshotLink{
				ProgramID:   vplProgram.ID,
				InstanceID:  link.InstanceID,
				ParameterID: link.ParameterID,
			}
		}),
	}
}
