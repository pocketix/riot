package dto2api

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/types"
)

func KPIFulfillmentCheckResultDTOToKPIFulfillmentCheckResult(kpiFulfillmentCheckResultDTO types.KPIFulfillmentCheckResultDTO) graphQLModel.KPIFulfillmentCheckResult {
	return graphQLModel.KPIFulfillmentCheckResult{
		KpiDefinitionID: kpiFulfillmentCheckResultDTO.KPIDefinitionID,
		SdInstanceID:    kpiFulfillmentCheckResultDTO.SDInstanceID,
		Fulfilled:       kpiFulfillmentCheckResultDTO.Fulfilled,
	}
}
