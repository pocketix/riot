package db2dll

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

func ToDLLModelSDParameterSnapshot(parameterSnapshot dbModel.SDParameterSnapshotEntity) dllModel.SDParameterSnapshot {
	return dllModel.SDParameterSnapshot{
		SDInstance:  parameterSnapshot.SDInstanceID,
		SDParameter: parameterSnapshot.SDParameterID,
		String:      sharedUtils.NewOptionalFromPointer(parameterSnapshot.String),
		Number:      sharedUtils.NewOptionalFromPointer(parameterSnapshot.Number),
		Boolean:     sharedUtils.NewOptionalFromPointer(parameterSnapshot.Boolean),
		UpdatedAt:   parameterSnapshot.UpdatedAt,
	}
}
