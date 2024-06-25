package dbModel

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/db/dbUtil"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"gorm.io/gorm"
)

// BeforeUpdate is a GORM hook implemented with the goal of getting rid of redundant SD instance group membership records. This is not handled by the update operation itself.
func (s SDInstanceGroupEntity) BeforeUpdate(tx *gorm.DB) error {
	referencesCurrentSDInstanceGroup := dbUtil.Where("sd_instance_group_id = ?", s.ID)
	referencesSDInstanceOutsideCurrentGroup := dbUtil.Where("sd_instance_id NOT IN (?)", sharedUtils.Map(s.GroupMembershipRecords, func(sdInstanceGroupMembershipEntity SDInstanceGroupMembershipEntity) uint32 {
		return sdInstanceGroupMembershipEntity.SDInstanceID
	}))
	return dbUtil.DeleteEntitiesBasedOnWhereClauses[SDInstanceGroupMembershipEntity](tx, referencesCurrentSDInstanceGroup, referencesSDInstanceOutsideCurrentGroup)
}

// AfterDelete is a GORM hook implemented with the goal of getting rid of SD instance groups that become empty as a result of SD type deletion.
func (s SDTypeEntity) AfterDelete(tx *gorm.DB) error {
	sdInstanceGroupEntitiesLoadResult := dbUtil.LoadEntitiesFromDB[SDInstanceGroupEntity](tx)
	if sdInstanceGroupEntitiesLoadResult.IsFailure() {
		return sdInstanceGroupEntitiesLoadResult.GetError()
	}
	sdInstanceGroupEntities := sdInstanceGroupEntitiesLoadResult.GetPayload()
	for _, sdInstanceGroupEntity := range sdInstanceGroupEntities {
		currentSDInstanceGroupID := sdInstanceGroupEntity.ID
		referencesCurrentSDInstanceGroup := dbUtil.Where("sd_instance_group_id = ?", currentSDInstanceGroupID)
		currentSDInstanceGroupMembershipRecordExistenceCheckResult := dbUtil.DoesSuchEntityExist[SDInstanceGroupMembershipEntity](tx, referencesCurrentSDInstanceGroup)
		if currentSDInstanceGroupMembershipRecordExistenceCheckResult.IsFailure() {
			return currentSDInstanceGroupMembershipRecordExistenceCheckResult.GetError()
		}
		if !currentSDInstanceGroupMembershipRecordExistenceCheckResult.GetPayload() {
			if err := dbUtil.DeleteCertainEntityBasedOnId[SDInstanceGroupEntity](tx, currentSDInstanceGroupID); err != nil {
				return err
			}
		}
	}
	return nil
}
