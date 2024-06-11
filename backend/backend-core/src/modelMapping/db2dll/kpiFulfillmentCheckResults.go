package db2dll

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
)

func ToDLLModelKPIFulfillmentCheckResult(kpiFulfillmentCheckResultEntity dbModel.KPIFulfillmentCheckResultEntity) dllModel.KPIFulfillmentCheckResult {
	return dllModel.KPIFulfillmentCheckResult{
		KPIDefinitionID: kpiFulfillmentCheckResultEntity.KPIDefinitionID,
		SDInstanceID:    kpiFulfillmentCheckResultEntity.SDInstanceID,
		Fulfilled:       kpiFulfillmentCheckResultEntity.Fulfilled,
	}
}
