package service

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/api/graphql/model"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/mapping/api2dto"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/mapping/dto2api"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func CreateSDType(sdTypeInput model.SDTypeInput) util.Result[*model.SDType] {
	sdTypeDTO := api2dto.SDTypeInputToSDTypeDTO(sdTypeInput)
	persistResult := (*db.GetRelationalDatabaseClientInstance()).PersistSDType(sdTypeDTO)
	if persistResult.IsFailure() {
		return util.NewFailureResult[*model.SDType](persistResult.GetError())
	}
	go func() { // TODO: SD type successfully persisted: inform MQTT preprocessor through RabbitMQ
	}()
	id := persistResult.GetPayload()
	sdTypeDTO.ID = util.NewOptionalOf[uint32](id)
	sdType := dto2api.SDTypeDTOToSDType(sdTypeDTO)
	return util.NewSuccessResult[*model.SDType](sdType)
}

func DeleteSDType(stringID string) error {
	uint32FromStringResult := util.UINT32FromString(stringID)
	if uint32FromStringResult.IsFailure() {
		return uint32FromStringResult.GetError()
	}
	id := uint32FromStringResult.GetPayload()
	return (*db.GetRelationalDatabaseClientInstance()).DeleteSDType(id)
	// TODO: Inform 'MQTT preprocessor' through RabbitMQ
}

func UpdateSDInstance(stringID string, sdInstanceUpdateInput model.SDInstanceUpdateInput) util.Result[*model.SDInstance] {
	uint32FromStringResult := util.UINT32FromString(stringID)
	if uint32FromStringResult.IsFailure() {
		return util.NewFailureResult[*model.SDInstance](uint32FromStringResult.GetError())
	}
	id := uint32FromStringResult.GetPayload()
	loadResult := (*db.GetRelationalDatabaseClientInstance()).LoadSDInstance(id)
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
	persistResult := (*db.GetRelationalDatabaseClientInstance()).PersistSDInstance(sdInstanceDTO)
	if persistResult.IsFailure() {
		return util.NewFailureResult[*model.SDInstance](persistResult.GetError())
	}
	sdInstance := dto2api.SDInstanceDTOToSDInstance(sdInstanceDTO)
	return util.NewSuccessResult[*model.SDInstance](sdInstance)
}

func GetSDType(stringID string) util.Result[*model.SDType] {
	uint32FromStringResult := util.UINT32FromString(stringID)
	if uint32FromStringResult.IsFailure() {
		return util.NewFailureResult[*model.SDType](uint32FromStringResult.GetError())
	}
	id := uint32FromStringResult.GetPayload()
	loadResult := (*db.GetRelationalDatabaseClientInstance()).LoadSDType(id)
	if loadResult.IsFailure() {
		return util.NewFailureResult[*model.SDType](loadResult.GetError())
	}
	sdType := dto2api.SDTypeDTOToSDType(loadResult.GetPayload())
	return util.NewSuccessResult[*model.SDType](sdType)
}

func GetSDTypes() util.Result[[]*model.SDType] {
	loadResult := (*db.GetRelationalDatabaseClientInstance()).LoadSDTypes()
	if loadResult.IsFailure() {
		return util.NewFailureResult[[]*model.SDType](loadResult.GetError())
	}
	return util.NewSuccessResult[[]*model.SDType](util.Map(loadResult.GetPayload(), dto2api.SDTypeDTOToSDType))
}

func GetSDInstances() util.Result[[]*model.SDInstance] {
	loadResult := (*db.GetRelationalDatabaseClientInstance()).LoadSDInstances()
	if loadResult.IsFailure() {
		return util.NewFailureResult[[]*model.SDInstance](loadResult.GetError())
	}
	return util.NewSuccessResult[[]*model.SDInstance](util.Map(loadResult.GetPayload(), dto2api.SDInstanceDTOToSDInstance))
}
