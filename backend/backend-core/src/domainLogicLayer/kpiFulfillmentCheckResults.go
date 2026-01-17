package domainLogicLayer

import (
	"github.com/pocketix/riot/backend-core/src/db/dbClient"
	"github.com/pocketix/riot/backend-core/src/model/graphQLModel"
	"github.com/pocketix/riot/backend-core/src/modelMapping/dll2gql"
	"github.com/pocketix/riot/commons/src/sharedUtils"
)

func GetKPIFulfillmentCheckResults() sharedUtils.Result[[]graphQLModel.KPIFulfillmentCheckResult] {
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadKPIFulFulfillmentCheckResults()
	if loadResult.IsFailure() {
		return sharedUtils.NewFailureResult[[]graphQLModel.KPIFulfillmentCheckResult](loadResult.GetError())
	}
	return sharedUtils.NewSuccessResult[[]graphQLModel.KPIFulfillmentCheckResult](sharedUtils.Map(loadResult.GetPayload(), dll2gql.ToGraphQLModelKPIFulfillmentCheckResult))
}
