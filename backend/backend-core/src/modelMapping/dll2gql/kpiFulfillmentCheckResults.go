package dll2gql

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/graphQLModel"
)

func ToGraphQLModelKPIFulfillmentCheckResult(kpiFulfillmentCheckResult dllModel.KPIFulfillmentCheckResult) graphQLModel.KPIFulfillmentCheckResult {
	return graphQLModel.KPIFulfillmentCheckResult{
		KpiDefinitionID: kpiFulfillmentCheckResult.KPIDefinitionID,
		SdInstanceID:    kpiFulfillmentCheckResult.SDInstanceID,
		Fulfilled:       kpiFulfillmentCheckResult.Fulfilled,
	}
}
