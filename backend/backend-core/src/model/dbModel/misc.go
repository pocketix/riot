package dbModel

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/dbUtil"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedUtils"
	"gorm.io/gorm"
)

func GetIDsOfKPINodeEntitiesFormingTheKPIDefinition(g *gorm.DB, kpiDefinitionID uint32) sharedUtils.Result[[]uint32] {
	kpiDefinitionEntityLoadResult := dbUtil.LoadEntityFromDB[KPIDefinitionEntity](g, dbUtil.Where("id = ?", kpiDefinitionID))
	if kpiDefinitionEntityLoadResult.IsFailure() {
		err := fmt.Errorf("failed to load KPI definition entity with ID = %d from the database: %w", kpiDefinitionID, kpiDefinitionEntityLoadResult.GetError())
		return sharedUtils.NewFailureResult[[]uint32](err)
	}
	kpiDefinitionEntity := kpiDefinitionEntityLoadResult.GetPayload()
	kpiNodeEntitiesLoadResult := dbUtil.LoadEntitiesFromDB[KPINodeEntity](g)
	if kpiNodeEntitiesLoadResult.IsFailure() {
		err := fmt.Errorf("failed to load KPI node entities from the database: %w", kpiNodeEntitiesLoadResult.GetError())
		return sharedUtils.NewFailureResult[[]uint32](err)
	}
	setOfIDsOfKPINodeEntitiesFormingTheDefinition := sharedUtils.NewSetFromSlice(sharedUtils.SliceOf(*kpiDefinitionEntity.RootNodeID))
	setOfRemainingKPINodeEntities := sharedUtils.NewSetFromSlice(kpiNodeEntitiesLoadResult.GetPayload())
	for {
		nextLayerOfKPINodeEntities := sharedUtils.Filter(setOfRemainingKPINodeEntities.ToSlice(), func(kpiNodeEntity KPINodeEntity) bool {
			parentNodeIDOptional := sharedUtils.NewOptionalFromPointer(kpiNodeEntity.ParentNodeID)
			if parentNodeIDOptional.IsEmpty() {
				return false
			}
			return setOfIDsOfKPINodeEntitiesFormingTheDefinition.Contains(parentNodeIDOptional.GetPayload())
		})
		if len(nextLayerOfKPINodeEntities) == 0 {
			break
		}
		sharedUtils.ForEach(nextLayerOfKPINodeEntities, func(kpiNodeEntity KPINodeEntity) {
			setOfIDsOfKPINodeEntitiesFormingTheDefinition.Add(kpiNodeEntity.ID)
			setOfRemainingKPINodeEntities.Delete(kpiNodeEntity)
		})
	}
	return sharedUtils.NewSuccessResult[[]uint32](setOfIDsOfKPINodeEntitiesFormingTheDefinition.ToSlice())
}
