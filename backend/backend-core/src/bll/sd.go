package bll

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/isc"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/mapping/api2dto"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/mapping/dto2api"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func CreateSDType(sdTypeInput graphQLModel.SDTypeInput) util.Result[graphQLModel.SDType] {
	sdTypeDTO := api2dto.SDTypeInputToSDTypeDTO(sdTypeInput)
	persistResult := dbClient.GetRelationalDatabaseClientInstance().PersistSDType(sdTypeDTO)
	if persistResult.IsFailure() {
		return util.NewFailureResult[graphQLModel.SDType](persistResult.GetError())
	}
	go isc.EnqueueMessageRepresentingCurrentSDTypeConfiguration()
	sdType := dto2api.SDTypeDTOToSDType(persistResult.GetPayload())
	return util.NewSuccessResult[graphQLModel.SDType](sdType)
}

func DeleteSDType(id uint32) error {
	if err := dbClient.GetRelationalDatabaseClientInstance().DeleteSDType(id); err != nil {
		return err
	}
	go isc.EnqueueMessagesRepresentingCurrentSystemConfiguration()
	return nil
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

func GetSDType(id uint32) util.Result[graphQLModel.SDType] {
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDType(id)
	if loadResult.IsFailure() {
		return util.NewFailureResult[graphQLModel.SDType](loadResult.GetError())
	}
	return util.NewSuccessResult[graphQLModel.SDType](dto2api.SDTypeDTOToSDType(loadResult.GetPayload()))
}

func GetSDTypes() util.Result[[]graphQLModel.SDType] {
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDTypes()
	if loadResult.IsFailure() {
		return util.NewFailureResult[[]graphQLModel.SDType](loadResult.GetError())
	}
	return util.NewSuccessResult[[]graphQLModel.SDType](util.Map(loadResult.GetPayload(), dto2api.SDTypeDTOToSDType))
}

func GetSDInstances() util.Result[[]graphQLModel.SDInstance] {
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDInstances()
	if loadResult.IsFailure() {
		return util.NewFailureResult[[]graphQLModel.SDInstance](loadResult.GetError())
	}
	return util.NewSuccessResult[[]graphQLModel.SDInstance](util.Map(loadResult.GetPayload(), dto2api.SDInstanceDTOToSDInstance))
}
