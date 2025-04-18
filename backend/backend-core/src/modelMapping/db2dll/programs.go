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
		SDParameterSnapshots: sharedUtils.Map(entity.SDParameterSnapshots, func(snapshot dbModel.SDParameterSnapshotEntity) dllModel.SDParameterSnapshot {
			return dllModel.SDParameterSnapshot{
				SDInstance:  snapshot.SDInstanceID,
				SDParameter: snapshot.SDParameterID,
			}
		}),
	}
}
