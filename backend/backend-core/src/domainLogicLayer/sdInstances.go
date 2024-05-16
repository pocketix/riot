package domainLogicLayer

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/isc"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/mapping/dto2api"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func GetSDInstances() util.Result[[]graphQLModel.SDInstance] {
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDInstances()
	if loadResult.IsFailure() {
		return util.NewFailureResult[[]graphQLModel.SDInstance](loadResult.GetError())
	}
	return util.NewSuccessResult[[]graphQLModel.SDInstance](util.Map(loadResult.GetPayload(), dto2api.SDInstanceDTOToSDInstance))
}

func UpdateSDInstance(id uint32, sdInstanceUpdateInput graphQLModel.SDInstanceUpdateInput) util.Result[graphQLModel.SDInstance] {
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDInstance(id)
	if loadResult.IsFailure() {
		return util.NewFailureResult[graphQLModel.SDInstance](loadResult.GetError())
	}
	sdInstanceDTO := loadResult.GetPayload()
	userIdentifierOptional := util.NewOptionalFromPointer(sdInstanceUpdateInput.UserIdentifier)
	if userIdentifierOptional.IsPresent() {
		sdInstanceDTO.UserIdentifier = userIdentifierOptional.GetPayload()
	}
	confirmedByUserOptional := util.NewOptionalFromPointer(sdInstanceUpdateInput.ConfirmedByUser)
	if confirmedByUserOptional.IsPresent() {
		sdInstanceDTO.ConfirmedByUser = confirmedByUserOptional.GetPayload()
	}
	persistResult := dbClient.GetRelationalDatabaseClientInstance().PersistSDInstance(sdInstanceDTO)
	if persistResult.IsFailure() {
		return util.NewFailureResult[graphQLModel.SDInstance](persistResult.GetError())
	}
	go isc.EnqueueMessageRepresentingCurrentSDInstanceConfiguration()
	sdInstance := dto2api.SDInstanceDTOToSDInstance(sdInstanceDTO)
	return util.NewSuccessResult[graphQLModel.SDInstance](sdInstance)
}
