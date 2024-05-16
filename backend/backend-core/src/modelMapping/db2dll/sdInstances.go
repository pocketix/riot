package db2dll

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func ToDLLModelSDInstance(sdInstanceEntity dbModel.SDInstanceEntity) dllModel.SDInstance {
	return dllModel.SDInstance{
		ID:              util.NewOptionalOf[uint32](sdInstanceEntity.ID),
		UID:             sdInstanceEntity.UID,
		ConfirmedByUser: sdInstanceEntity.ConfirmedByUser,
		UserIdentifier:  sdInstanceEntity.UserIdentifier,
		SDType:          ToDLLModelSDType(sdInstanceEntity.SDType),
	}
}
