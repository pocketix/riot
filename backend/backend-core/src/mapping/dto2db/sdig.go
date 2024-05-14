package dto2db

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/dbSchema"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/types"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func SDInstanceGroupDTOToSDInstanceGroupEntity(sdInstanceGroupDTO types.SDInstanceGroupDTO) dbSchema.SDInstanceGroupEntity {
	sdInstanceGroupID := sdInstanceGroupDTO.ID.GetPayloadOrDefault(0)
	return dbSchema.SDInstanceGroupEntity{
		ID:             sdInstanceGroupID,
		UserIdentifier: sdInstanceGroupDTO.UserIdentifier,
		GroupMembershipRecords: util.Map[uint32, dbSchema.SDInstanceGroupMembershipEntity](sdInstanceGroupDTO.SDInstanceIDs, func(sdInstanceID uint32) dbSchema.SDInstanceGroupMembershipEntity {
			return dbSchema.SDInstanceGroupMembershipEntity{
				SDInstanceGroupID: sdInstanceGroupID,
				SDInstanceID:      sdInstanceID,
			}
		}),
	}
}
