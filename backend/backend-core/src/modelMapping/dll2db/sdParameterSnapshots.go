package dll2db

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
)

func ToDBModelEntitySDParameterSnapshot(snapshot dllModel.SDParameterSnapshot, sdInstanceId uint32, sdParameterId uint32) dbModel.SDParameterSnapshotEntity {
	return dbModel.SDParameterSnapshotEntity{
		SDParameterID: sdParameterId,
		SDInstanceID:  sdInstanceId,
		UpdatedAt:     snapshot.UpdatedAt,
		String:        snapshot.String,
		Boolean:       snapshot.Boolean,
		Number:        snapshot.Number,
	}
}
