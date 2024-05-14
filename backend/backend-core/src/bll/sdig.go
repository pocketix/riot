package bll

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/api/graphql/model"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/mapping/api2dto"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/mapping/dto2api"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func GetSDInstanceGroup(stringID string) util.Result[*model.SDInstanceGroup] {
	uint32FromStringResult := util.UINT32FromString(stringID)
	if uint32FromStringResult.IsFailure() {
		return util.NewFailureResult[*model.SDInstanceGroup](uint32FromStringResult.GetError())
	}
	sdInstanceGroupLoadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDInstanceGroup(uint32FromStringResult.GetPayload())
	if sdInstanceGroupLoadResult.IsFailure() {
		return util.NewFailureResult[*model.SDInstanceGroup](sdInstanceGroupLoadResult.GetError())
	}
	return util.NewSuccessResult(dto2api.SDInstanceGroupDTOToSDInstanceGroup(sdInstanceGroupLoadResult.GetPayload()))
}

func GetSDInstanceGroups() util.Result[[]*model.SDInstanceGroup] {
	sdInstanceGroupsLoadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDInstanceGroups()
	if sdInstanceGroupsLoadResult.IsFailure() {
		return util.NewFailureResult[[]*model.SDInstanceGroup](sdInstanceGroupsLoadResult.GetError())
	}
	return util.NewSuccessResult(util.Map(sdInstanceGroupsLoadResult.GetPayload(), dto2api.SDInstanceGroupDTOToSDInstanceGroup))
}

func CreateSDInstanceGroup(input model.SDInstanceGroupInput) util.Result[*model.SDInstanceGroup] {
	toDTOMappingResult := api2dto.SDInstanceGroupInputToSDInstanceGroupDTO(input)
	if toDTOMappingResult.IsFailure() {
		return util.NewFailureResult[*model.SDInstanceGroup](toDTOMappingResult.GetError())
	}
	sdInstanceGroupDTO := toDTOMappingResult.GetPayload()
	sdInstanceGroupPersistResult := dbClient.GetRelationalDatabaseClientInstance().PersistSDInstanceGroup(sdInstanceGroupDTO)
	if sdInstanceGroupPersistResult.IsFailure() {
		return util.NewFailureResult[*model.SDInstanceGroup](sdInstanceGroupPersistResult.GetError())
	}
	sdInstanceGroupDTO.ID = util.NewOptionalOf(sdInstanceGroupPersistResult.GetPayload())
	return util.NewSuccessResult(dto2api.SDInstanceGroupDTOToSDInstanceGroup(sdInstanceGroupDTO))
}

func UpdateSDInstanceGroup(stringID string, input model.SDInstanceGroupInput) util.Result[*model.SDInstanceGroup] {
	uint32FromStringResult := util.UINT32FromString(stringID)
	if uint32FromStringResult.IsFailure() {
		return util.NewFailureResult[*model.SDInstanceGroup](fmt.Errorf("non-numeric ID detected: %w", uint32FromStringResult.GetError()))
	}
	toDTOMappingResult := api2dto.SDInstanceGroupInputToSDInstanceGroupDTO(input)
	if toDTOMappingResult.IsFailure() {
		return util.NewFailureResult[*model.SDInstanceGroup](toDTOMappingResult.GetError())
	}
	sdInstanceGroupDTO := toDTOMappingResult.GetPayload()
	sdInstanceGroupDTO.ID = util.NewOptionalOf(uint32FromStringResult.GetPayload())
	if sdInstanceGroupPersistResult := dbClient.GetRelationalDatabaseClientInstance().PersistSDInstanceGroup(sdInstanceGroupDTO); sdInstanceGroupPersistResult.IsFailure() {
		return util.NewFailureResult[*model.SDInstanceGroup](sdInstanceGroupPersistResult.GetError())
	}
	return util.NewSuccessResult(dto2api.SDInstanceGroupDTOToSDInstanceGroup(sdInstanceGroupDTO))
}

func DeleteSDInstanceGroup(stringID string) error {
	uint32FromStringResult := util.UINT32FromString(stringID)
	if uint32FromStringResult.IsFailure() {
		return uint32FromStringResult.GetError()
	}
	return dbClient.GetRelationalDatabaseClientInstance().DeleteSDInstanceGroup(uint32FromStringResult.GetPayload())
}
