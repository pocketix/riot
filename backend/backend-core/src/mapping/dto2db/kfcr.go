package dto2db

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/schema"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/types"
)

func KPIFulfillmentCheckResultDTOToKPIFulfillmentCheckResultEntity(kpiFulfillmentCheckResultDTO types.KPIFulfillmentCheckResultDTO) schema.KPIFulfillmentCheckResultEntity {
	return schema.KPIFulfillmentCheckResultEntity{
		ID:              kpiFulfillmentCheckResultDTO.ID.GetPayloadOrDefault(0),
		KPIDefinitionID: kpiFulfillmentCheckResultDTO.KPIDefinition.ID.GetPayloadOrDefault(0),
		SDInstanceID:    kpiFulfillmentCheckResultDTO.SDInstance.ID.GetPayloadOrDefault(0),
		Fulfilled:       kpiFulfillmentCheckResultDTO.Fulfilled,
	}
}
