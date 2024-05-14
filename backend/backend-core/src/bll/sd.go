package bll

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/api/graphql/model"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/isc"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/mapping/api2dto"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/mapping/dto2api"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func CreateSDType(sdTypeInput model.SDTypeInput) util.Result[*model.SDType] {
	sdTypeDTO := api2dto.SDTypeInputToSDTypeDTO(sdTypeInput)
	persistResult := dbClient.GetRelationalDatabaseClientInstance().PersistSDType(sdTypeDTO)
	if persistResult.IsFailure() {
		return util.NewFailureResult[*model.SDType](persistResult.GetError())
	}
	go isc.EnqueueMessageRepresentingCurrentSDTypeConfiguration()
	sdType := dto2api.SDTypeDTOToSDType(persistResult.GetPayload())
	return util.NewSuccessResult[*model.SDType](sdType)
}

func DeleteSDType(stringID string) error {
	uint32FromStringResult := util.UINT32FromString(stringID)
	if uint32FromStringResult.IsFailure() {
		return uint32FromStringResult.GetError()
	}
	if err := dbClient.GetRelationalDatabaseClientInstance().DeleteSDType(uint32FromStringResult.GetPayload()); err != nil {
		return err
	}
	go isc.EnqueueMessagesRepresentingCurrentSystemConfiguration()
	return nil
}

func UpdateSDInstance(stringID string, sdInstanceUpdateInput model.SDInstanceUpdateInput) util.Result[*model.SDInstance] {
	uint32FromStringResult := util.UINT32FromString(stringID)
	if uint32FromStringResult.IsFailure() {
		return util.NewFailureResult[*model.SDInstance](uint32FromStringResult.GetError())
	}
	id := uint32FromStringResult.GetPayload()
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDInstance(id)
	if loadResult.IsFailure() {
		return util.NewFailureResult[*model.SDInstance](loadResult.GetError())
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
		return util.NewFailureResult[*model.SDInstance](persistResult.GetError())
	}
	go isc.EnqueueMessageRepresentingCurrentSDInstanceConfiguration()
	sdInstance := dto2api.SDInstanceDTOToSDInstance(sdInstanceDTO)
	return util.NewSuccessResult[*model.SDInstance](sdInstance)
}

func GetSDType(stringID string) util.Result[*model.SDType] {
	uint32FromStringResult := util.UINT32FromString(stringID)
	if uint32FromStringResult.IsFailure() {
		return util.NewFailureResult[*model.SDType](uint32FromStringResult.GetError())
	}
	id := uint32FromStringResult.GetPayload()
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDType(id)
	if loadResult.IsFailure() {
		return util.NewFailureResult[*model.SDType](loadResult.GetError())
	}
	sdType := dto2api.SDTypeDTOToSDType(loadResult.GetPayload())
	return util.NewSuccessResult[*model.SDType](sdType)
}

func GetSDTypes() util.Result[[]*model.SDType] {
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDTypes()
	if loadResult.IsFailure() {
		return util.NewFailureResult[[]*model.SDType](loadResult.GetError())
	}
	return util.NewSuccessResult[[]*model.SDType](util.Map(loadResult.GetPayload(), dto2api.SDTypeDTOToSDType))
}

func GetSDInstances() util.Result[[]*model.SDInstance] {
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDInstances()
	if loadResult.IsFailure() {
		return util.NewFailureResult[[]*model.SDInstance](loadResult.GetError())
	}
	return util.NewSuccessResult[[]*model.SDInstance](util.Map(loadResult.GetPayload(), dto2api.SDInstanceDTOToSDInstance))
}
