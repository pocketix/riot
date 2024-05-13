package schema

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
	"gorm.io/gorm"
)

func (s SDInstanceGroupEntity) BeforeUpdate(tx *gorm.DB) error {
	sdInstanceGroupID := s.ID
	sdInstanceIDs := util.Map(s.GroupMembershipRecords, func(sdInstanceGroupMembershipEntity SDInstanceGroupMembershipEntity) uint32 {
		return sdInstanceGroupMembershipEntity.SDInstanceID
	})
	return tx.
		Where("sd_instance_group_id = ?", sdInstanceGroupID).
		Where("sd_instance_id NOT IN (?)", sdInstanceIDs).
		Delete(new(SDInstanceGroupMembershipEntity)).
		Error
}
