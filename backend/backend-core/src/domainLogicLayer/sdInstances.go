package domainLogicLayer

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/isc"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/modelMapping/dll2gql"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func GetSDInstances() util.Result[[]graphQLModel.SDInstance] {
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDInstances()
	if loadResult.IsFailure() {
		return util.NewFailureResult[[]graphQLModel.SDInstance](loadResult.GetError())
	}
	return util.NewSuccessResult[[]graphQLModel.SDInstance](util.Map(loadResult.GetPayload(), dll2gql.ToGraphQLModelSDInstance))
}

func UpdateSDInstance(id uint32, sdInstanceUpdateInput graphQLModel.SDInstanceUpdateInput) util.Result[graphQLModel.SDInstance] {
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDInstance(id)
	if loadResult.IsFailure() {
		return util.NewFailureResult[graphQLModel.SDInstance](loadResult.GetError())
	}
	sdInstance := loadResult.GetPayload()
	util.NewOptionalFromPointer(sdInstanceUpdateInput.UserIdentifier).DoIfPresent(func(userIdentifier string) {
		sdInstance.UserIdentifier = userIdentifier
	})
	util.NewOptionalFromPointer(sdInstanceUpdateInput.ConfirmedByUser).DoIfPresent(func(confirmedByUser bool) {
		sdInstance.ConfirmedByUser = confirmedByUser
	})
	if persistResult := dbClient.GetRelationalDatabaseClientInstance().PersistSDInstance(sdInstance); persistResult.IsFailure() {
		return util.NewFailureResult[graphQLModel.SDInstance](persistResult.GetError())
	}
	go isc.EnqueueMessageRepresentingCurrentSDInstanceConfiguration()
	return util.NewSuccessResult[graphQLModel.SDInstance](dll2gql.ToGraphQLModelSDInstance(sdInstance))
}
