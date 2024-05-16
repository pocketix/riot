package dll2db

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/dllModel"
)

func ToDBModelEntitySDInstance(sdInstance dllModel.SDInstance) dbModel.SDInstanceEntity {
	return dbModel.SDInstanceEntity{
		ID:              sdInstance.ID.GetPayloadOrDefault(0),
		UID:             sdInstance.UID,
		ConfirmedByUser: sdInstance.ConfirmedByUser,
		UserIdentifier:  sdInstance.UserIdentifier,
		SDTypeID:        sdInstance.SDType.ID.GetPayloadOrDefault(0),
	}
}
