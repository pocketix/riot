package service

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/api/graphql/model"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/mapping/dto2api"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func GetKPIFulfillmentCheckResults() util.Result[[]*model.KPIFulfillmentCheckResult] {
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadKPIFulFulfillmentCheckResults()
	if loadResult.IsFailure() {
		return util.NewFailureResult[[]*model.KPIFulfillmentCheckResult](loadResult.GetError())
	}
	return util.NewSuccessResult[[]*model.KPIFulfillmentCheckResult](util.Map(loadResult.GetPayload(), dto2api.KPIFulfillmentCheckResultDTOToKPIFulfillmentCheckResult))
}
