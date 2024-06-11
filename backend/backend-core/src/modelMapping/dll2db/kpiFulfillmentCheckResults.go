package dll2db

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
)

func ToDBModelEntityKPIFulfillmentCheckResult(kpiFulfillmentCheckResult dllModel.KPIFulfillmentCheckResult) dbModel.KPIFulfillmentCheckResultEntity {
	return dbModel.KPIFulfillmentCheckResultEntity{
		KPIDefinitionID: kpiFulfillmentCheckResult.KPIDefinitionID,
		SDInstanceID:    kpiFulfillmentCheckResult.SDInstanceID,
		Fulfilled:       kpiFulfillmentCheckResult.Fulfilled,
	}
}
