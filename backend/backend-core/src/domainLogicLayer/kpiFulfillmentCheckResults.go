package domainLogicLayer

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/modelMapping/dll2gql"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func GetKPIFulfillmentCheckResults() util.Result[[]graphQLModel.KPIFulfillmentCheckResult] {
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadKPIFulFulfillmentCheckResults()
	if loadResult.IsFailure() {
		return util.NewFailureResult[[]graphQLModel.KPIFulfillmentCheckResult](loadResult.GetError())
	}
	return util.NewSuccessResult[[]graphQLModel.KPIFulfillmentCheckResult](util.Map(loadResult.GetPayload(), dll2gql.ToGraphQLModelKPIFulfillmentCheckResult))
}
