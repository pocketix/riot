package db2dto

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/schema"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/types"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func KPIFulfillmentCheckResultEntityToKPIFulfillmentCheckResultDTO(kpiFulfillmentCheckResultEntity schema.KPIFulfillmentCheckResultEntity, kpiNodeEntities []schema.KPINodeEntity, logicalOperationKPINodeEntities []schema.LogicalOperationKPINodeEntity, atomKPINodeEntities []schema.AtomKPINodeEntity) types.KPIFulfillmentCheckResultDTO {
	kpiDefinitionEntity := util.NewOptionalFromPointer(kpiFulfillmentCheckResultEntity.KPIDefinition).GetPayload()
	sdInstanceEntity := util.NewOptionalFromPointer(kpiFulfillmentCheckResultEntity.SDInstance).GetPayload()
	return types.KPIFulfillmentCheckResultDTO{
		ID:            util.NewOptionalOf(kpiFulfillmentCheckResultEntity.ID),
		KPIDefinition: ReconstructKPIDefinitionDTO(kpiDefinitionEntity, kpiNodeEntities, logicalOperationKPINodeEntities, atomKPINodeEntities),
		SDInstance:    SDInstanceEntityToSDInstanceDTO(sdInstanceEntity),
		Fulfilled:     kpiFulfillmentCheckResultEntity.Fulfilled,
	}
}
