package service

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/api/graphql/model"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/mapping/api2dto"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/mapping/dto2api"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
	"log"
)

func GetSDInstanceGroup(stringID string) util.Result[*model.SDInstanceGroup] {
	uint32FromStringResult := util.UINT32FromString(stringID)
	if uint32FromStringResult.IsFailure() {
		return util.NewFailureResult[*model.SDInstanceGroup](uint32FromStringResult.GetError())
	}
	sdInstanceGroupLoadResult := db.GetRelationalDatabaseClientInstance().LoadSDInstanceGroup(uint32FromStringResult.GetPayload())
	if sdInstanceGroupLoadResult.IsFailure() {
		return util.NewFailureResult[*model.SDInstanceGroup](sdInstanceGroupLoadResult.GetError())
	}
	return util.NewSuccessResult(dto2api.SDInstanceGroupDTOToSDInstanceGroup(sdInstanceGroupLoadResult.GetPayload()))
}

func GetSDInstanceGroups() util.Result[[]*model.SDInstanceGroup] {
	sdInstanceGroupsLoadResult := db.GetRelationalDatabaseClientInstance().LoadSDInstanceGroups()
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
	sdInstanceGroupPersistResult := db.GetRelationalDatabaseClientInstance().PersistSDInstanceGroup(sdInstanceGroupDTO)
	if sdInstanceGroupPersistResult.IsFailure() {
		return util.NewFailureResult[*model.SDInstanceGroup](sdInstanceGroupPersistResult.GetError())
	}
	sdInstanceGroupDTO.ID = util.NewOptionalOf(sdInstanceGroupPersistResult.GetPayload())
	return util.NewSuccessResult(dto2api.SDInstanceGroupDTOToSDInstanceGroup(sdInstanceGroupDTO))
}

func UpdateSDInstanceGroup(stringID string, input model.SDInstanceGroupUpdateInput) util.Result[*model.SDInstanceGroup] {
	uint32FromStringResult := util.UINT32FromString(stringID)
	if uint32FromStringResult.IsFailure() {
		return util.NewFailureResult[*model.SDInstanceGroup](fmt.Errorf("non-numeric ID detected: %w", uint32FromStringResult.GetError()))
	}
	sdInstanceIDsToAdd, err := util.EMap[string, uint32](input.SdInstanceIDsToAdd, func(stringID string) (uint32, error) {
		return util.UINT32FromString(stringID).Unwrap()
	})
	if err != nil {
		return util.NewFailureResult[*model.SDInstanceGroup](fmt.Errorf("the sdInstanceIDsToAdd field seems to contain non-numeric IDs: %w", err))
	}
	sdInstanceIDsToRemove, err := util.EMap[string, uint32](input.SdInstanceIDsToRemove, func(stringID string) (uint32, error) {
		return util.UINT32FromString(stringID).Unwrap()
	})
	if err != nil {
		return util.NewFailureResult[*model.SDInstanceGroup](fmt.Errorf("the sdInstanceIDsToRemove field seems to contain non-numeric IDs: %w", err))
	}
	sdInstanceGroupLoadResult := db.GetRelationalDatabaseClientInstance().LoadSDInstanceGroup(uint32FromStringResult.GetPayload())
	if sdInstanceGroupLoadResult.IsFailure() {
		return util.NewFailureResult[*model.SDInstanceGroup](sdInstanceGroupLoadResult.GetError())
	}
	sdInstanceGroupDTO := sdInstanceGroupLoadResult.GetPayload()
	setOfSDInstanceIDsToAdd := util.NewSetFromSlice(sdInstanceIDsToAdd)
	setOfSDInstancesToRemove := util.NewSetFromSlice(sdInstanceIDsToRemove)
	if setOfSDInstanceIDsToAdd.HasIntersectionWith(setOfSDInstancesToRemove) {
		log.Println("Warn: the sets of SD instance IDs to add and to remove through the 'updateSDInstanceGroup' mutation intersect")
	}
	sdInstanceGroupDTO.SDInstanceIDs = util.NewSetFromSlice(sdInstanceGroupDTO.SDInstanceIDs).
		GenerateUnionWith(setOfSDInstanceIDsToAdd).
		GenerateDifferenceWith(setOfSDInstancesToRemove).
		ToSlice()
	util.NewOptionalFromPointer(input.NewUserIdentifier).DoIfPresent(func(newUserIdentifier string) {
		sdInstanceGroupDTO.UserIdentifier = newUserIdentifier
	})
	if sdInstanceGroupPersistResult := db.GetRelationalDatabaseClientInstance().PersistSDInstanceGroup(sdInstanceGroupDTO); sdInstanceGroupPersistResult.IsFailure() {
		return util.NewFailureResult[*model.SDInstanceGroup](sdInstanceGroupPersistResult.GetError())
	}
	return util.NewSuccessResult(dto2api.SDInstanceGroupDTOToSDInstanceGroup(sdInstanceGroupDTO))
}

func DeleteSDInstanceGroup(stringID string) error {
	uint32FromStringResult := util.UINT32FromString(stringID)
	if uint32FromStringResult.IsFailure() {
		return uint32FromStringResult.GetError()
	}
	return db.GetRelationalDatabaseClientInstance().DeleteSDInstanceGroup(uint32FromStringResult.GetPayload())
}
