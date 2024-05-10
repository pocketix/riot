package db2dto

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/schema"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/types"
)

func KPIFulfillmentCheckResultEntityToKPIFulfillmentCheckResultDTO(kpiFulfillmentCheckResultEntity schema.KPIFulfillmentCheckResultEntity) types.KPIFulfillmentCheckResultDTO {
	return types.KPIFulfillmentCheckResultDTO{
		KPIDefinitionID: kpiFulfillmentCheckResultEntity.KPIDefinitionID,
		SDInstanceID:    kpiFulfillmentCheckResultEntity.SDInstanceID,
		Fulfilled:       kpiFulfillmentCheckResultEntity.Fulfilled,
	}
}
