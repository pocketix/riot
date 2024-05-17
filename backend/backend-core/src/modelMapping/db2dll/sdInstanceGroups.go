package db2dll

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedUtils"
)

func ToDLLModelSDInstanceGroup(sdInstanceGroupEntity dbModel.SDInstanceGroupEntity) dllModel.SDInstanceGroup {
	return dllModel.SDInstanceGroup{
		ID:             sharedUtils.NewOptionalOf(sdInstanceGroupEntity.ID),
		UserIdentifier: sdInstanceGroupEntity.UserIdentifier,
		SDInstanceIDs: sharedUtils.Map(sdInstanceGroupEntity.GroupMembershipRecords, func(sdInstanceGroupMembershipEntity dbModel.SDInstanceGroupMembershipEntity) uint32 {
			return sdInstanceGroupMembershipEntity.SDInstanceID
		}),
	}
}
