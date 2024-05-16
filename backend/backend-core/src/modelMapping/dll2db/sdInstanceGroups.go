package dll2db

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func ToDBModelEntitySDInstanceGroup(sdInstanceGroup dllModel.SDInstanceGroup) dbModel.SDInstanceGroupEntity {
	sdInstanceGroupID := sdInstanceGroup.ID.GetPayloadOrDefault(0)
	return dbModel.SDInstanceGroupEntity{
		ID:             sdInstanceGroupID,
		UserIdentifier: sdInstanceGroup.UserIdentifier,
		GroupMembershipRecords: util.Map[uint32, dbModel.SDInstanceGroupMembershipEntity](sdInstanceGroup.SDInstanceIDs, func(sdInstanceID uint32) dbModel.SDInstanceGroupMembershipEntity {
			return dbModel.SDInstanceGroupMembershipEntity{
				SDInstanceGroupID: sdInstanceGroupID,
				SDInstanceID:      sdInstanceID,
			}
		}),
	}
}
