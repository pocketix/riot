package dto2db

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/schema"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/types"
)

func KPIFulfillmentCheckResultDTOToKPIFulfillmentCheckResultEntity(kpiFulfillmentCheckResultDTO types.KPIFulfillmentCheckResultDTO) schema.KPIFulfillmentCheckResultEntity {
	kpiDefinitionDTO := kpiFulfillmentCheckResultDTO.KPIDefinition
	kpiDefinitionID := kpiDefinitionDTO.ID.GetPayloadOrDefault(0)
	kpiNodeEntity, _, _, _ := TransformKPIDefinitionTree(kpiDefinitionDTO.RootNode, nil, make([]*schema.KPINodeEntity, 0), make([]schema.LogicalOperationKPINodeEntity, 0), make([]schema.AtomKPINodeEntity, 0))
	kpiDefinitionEntity := schema.KPIDefinitionEntity{
		ID:                  kpiDefinitionID,
		SDTypeSpecification: kpiDefinitionDTO.SDTypeSpecification,
		UserIdentifier:      kpiDefinitionDTO.UserIdentifier,
		RootNode:            kpiNodeEntity,
	}
	sdInstanceDTO := kpiFulfillmentCheckResultDTO.SDInstance
	sdInstanceID := sdInstanceDTO.ID.GetPayloadOrDefault(0)
	sdInstanceEntity := SDInstanceDTOToSDInstanceEntity(sdInstanceDTO)
	return schema.KPIFulfillmentCheckResultEntity{
		ID:              kpiFulfillmentCheckResultDTO.ID.GetPayloadOrDefault(0),
		KPIDefinitionID: &kpiDefinitionID,
		KPIDefinition:   &kpiDefinitionEntity,
		SDInstanceID:    &sdInstanceID,
		SDInstance:      &sdInstanceEntity,
		Fulfilled:       kpiFulfillmentCheckResultDTO.Fulfilled,
	}
}
