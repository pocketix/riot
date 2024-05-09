package db2dto

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/schema"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/types"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func KPIFulfillmentCheckResultEntityToKPIFulfillmentCheckResultDTO(kpiFulfillmentCheckResultEntity schema.KPIFulfillmentCheckResultEntity, kpiNodeEntities []schema.KPINodeEntity, logicalOperationKPINodeEntities []schema.LogicalOperationKPINodeEntity, atomKPINodeEntities []schema.AtomKPINodeEntity) types.KPIFulfillmentCheckResultDTO {
	return types.KPIFulfillmentCheckResultDTO{
		ID:            util.NewOptionalOf(kpiFulfillmentCheckResultEntity.ID),
		KPIDefinition: ReconstructKPIDefinitionDTO(kpiFulfillmentCheckResultEntity.KPIDefinition, kpiNodeEntities, logicalOperationKPINodeEntities, atomKPINodeEntities),
		SDInstance:    SDInstanceEntityToSDInstanceDTO(kpiFulfillmentCheckResultEntity.SDInstance),
		Fulfilled:     kpiFulfillmentCheckResultEntity.Fulfilled,
	}
}
