package db2dll

import (
	"github.com/pocketix/riot/backend-core/src/model/dbModel"
	"github.com/pocketix/riot/backend-core/src/model/dllModel"
	"github.com/pocketix/riot/commons/src/sharedUtils"
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
