package dto2api

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/api/graphql/model"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/types"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func KPIFulfillmentCheckResultDTOToKPIFulfillmentCheckResult(kpiFulfillmentCheckResultDTO types.KPIFulfillmentCheckResultDTO) *model.KPIFulfillmentCheckResult {
	return &model.KPIFulfillmentCheckResult{
		KpiDefinitionID: util.UINT32ToString(kpiFulfillmentCheckResultDTO.KPIDefinitionID),
		SdInstanceID:    util.UINT32ToString(kpiFulfillmentCheckResultDTO.SDInstanceID),
		Fulfilled:       kpiFulfillmentCheckResultDTO.Fulfilled,
	}
}
