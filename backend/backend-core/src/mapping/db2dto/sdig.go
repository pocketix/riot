package db2dto

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/schema"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/types"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func SDInstanceGroupEntityToSDInstanceGroupDTO(sdInstanceGroupEntity schema.SDInstanceGroupEntity) types.SDInstanceGroupDTO {
	return types.SDInstanceGroupDTO{
		ID:             util.NewOptionalOf(sdInstanceGroupEntity.ID),
		UserIdentifier: sdInstanceGroupEntity.UserIdentifier,
		SDInstanceIDs: util.Map(sdInstanceGroupEntity.GroupMembershipRecords, func(sdInstanceGroupMembershipEntity schema.SDInstanceGroupMembershipEntity) uint32 {
			return sdInstanceGroupMembershipEntity.SDInstanceID
		}),
	}
}
