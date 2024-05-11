package dto2db

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/schema"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/types"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func SDInstanceGroupDTOToSDInstanceGroupEntity(sdInstanceGroupDTO types.SDInstanceGroupDTO) schema.SDInstanceGroupEntity {
	sdInstanceGroupID := sdInstanceGroupDTO.ID.GetPayloadOrDefault(0)
	return schema.SDInstanceGroupEntity{
		ID:             sdInstanceGroupID,
		UserIdentifier: sdInstanceGroupDTO.UserIdentifier,
		GroupMembershipRecords: util.Map[uint32, schema.SDInstanceGroupMembershipEntity](sdInstanceGroupDTO.SDInstanceIDs, func(sdInstanceID uint32) schema.SDInstanceGroupMembershipEntity {
			return schema.SDInstanceGroupMembershipEntity{
				SDInstanceGroupID: sdInstanceGroupID,
				SDInstanceID:      sdInstanceID,
			}
		}),
	}
}
