package dto2db

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/dbSchema"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/types"
)

func KPIFulfillmentCheckResultDTOToKPIFulfillmentCheckResultEntity(kpiFulfillmentCheckResultDTO types.KPIFulfillmentCheckResultDTO) dbSchema.KPIFulfillmentCheckResultEntity {
	return dbSchema.KPIFulfillmentCheckResultEntity{
		KPIDefinitionID: kpiFulfillmentCheckResultDTO.KPIDefinitionID,
		SDInstanceID:    kpiFulfillmentCheckResultDTO.SDInstanceID,
		Fulfilled:       kpiFulfillmentCheckResultDTO.Fulfilled,
	}
}
