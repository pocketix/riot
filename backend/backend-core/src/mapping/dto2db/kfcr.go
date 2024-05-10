package dto2db

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/schema"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/types"
)

func KPIFulfillmentCheckResultDTOToKPIFulfillmentCheckResultEntity(kpiFulfillmentCheckResultDTO types.KPIFulfillmentCheckResultDTO) schema.KPIFulfillmentCheckResultEntity {
	return schema.KPIFulfillmentCheckResultEntity{
		KPIDefinitionID: kpiFulfillmentCheckResultDTO.KPIDefinitionID,
		SDInstanceID:    kpiFulfillmentCheckResultDTO.SDInstanceID,
		Fulfilled:       kpiFulfillmentCheckResultDTO.Fulfilled,
	}
}
