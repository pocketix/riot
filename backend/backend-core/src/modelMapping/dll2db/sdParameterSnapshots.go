package dll2db

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

func ToDBModelEntitySDParameterSnapshot(snapshot dllModel.SDParameterSnapshot, sdInstanceId uint32, sdParameterId uint32) dbModel.SDParameterSnapshotEntity {
	return dbModel.SDParameterSnapshotEntity{
		SDParameterID: sdParameterId,
		SDInstanceID:  sdInstanceId,
		UpdatedAt:     snapshot.UpdatedAt,
		String:        snapshot.String.ToPointer(),
		Boolean:       snapshot.Boolean.ToPointer(),
		Number:        snapshot.Number.ToPointer(),
		VPLPrograms: sharedUtils.Map(snapshot.VPLPrograms, func(link dllModel.VPLProgramSDSnapshotLink) dbModel.VPLProgramSDSnapshotLinkEntity {
			return dbModel.VPLProgramSDSnapshotLinkEntity{
				ProgramID:     link.ProgramID,
				SDInstanceID:  link.InstanceID,
				SDParameterID: link.ParameterID,
			}
		}),
	}
}
