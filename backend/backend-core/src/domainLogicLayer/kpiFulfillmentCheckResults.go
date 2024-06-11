package domainLogicLayer

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/modelMapping/dll2gql"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

func GetKPIFulfillmentCheckResults() sharedUtils.Result[[]graphQLModel.KPIFulfillmentCheckResult] {
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadKPIFulFulfillmentCheckResults()
	if loadResult.IsFailure() {
		return sharedUtils.NewFailureResult[[]graphQLModel.KPIFulfillmentCheckResult](loadResult.GetError())
	}
	return sharedUtils.NewSuccessResult[[]graphQLModel.KPIFulfillmentCheckResult](sharedUtils.Map(loadResult.GetPayload(), dll2gql.ToGraphQLModelKPIFulfillmentCheckResult))
}
