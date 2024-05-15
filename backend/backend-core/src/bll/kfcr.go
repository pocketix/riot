package bll

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/mapping/dto2api"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func GetKPIFulfillmentCheckResults() util.Result[[]graphQLModel.KPIFulfillmentCheckResult] {
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadKPIFulFulfillmentCheckResults()
	if loadResult.IsFailure() {
		return util.NewFailureResult[[]graphQLModel.KPIFulfillmentCheckResult](loadResult.GetError())
	}
	return util.NewSuccessResult[[]graphQLModel.KPIFulfillmentCheckResult](util.Map(loadResult.GetPayload(), dto2api.KPIFulfillmentCheckResultDTOToKPIFulfillmentCheckResult))
}
