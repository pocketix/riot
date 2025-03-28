package db2dll

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

func ToDLLModelSDInstance(sdInstanceEntity dbModel.SDInstanceEntity) dllModel.SDInstance {
	return dllModel.SDInstance{
		ID:                 sharedUtils.NewOptionalOf[uint32](sdInstanceEntity.ID),
		UID:                sdInstanceEntity.UID,
		ConfirmedByUser:    sdInstanceEntity.ConfirmedByUser,
		UserIdentifier:     sdInstanceEntity.UserIdentifier,
		SDType:             ToDLLModelSDType(sdInstanceEntity.SDType),
		ParameterSnapshots: sharedUtils.Map(sdInstanceEntity.SDParameterSnapshot, ToDLLModelSDParameterSnapshot),
	}
}
