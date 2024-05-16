package domainLogicLayer

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/mapping/api2dto"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/mapping/dto2api"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func GetSDInstanceGroup(id uint32) util.Result[graphQLModel.SDInstanceGroup] {
	sdInstanceGroupLoadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDInstanceGroup(id)
	if sdInstanceGroupLoadResult.IsFailure() {
		return util.NewFailureResult[graphQLModel.SDInstanceGroup](sdInstanceGroupLoadResult.GetError())
	}
	return util.NewSuccessResult(dto2api.SDInstanceGroupDTOToSDInstanceGroup(sdInstanceGroupLoadResult.GetPayload()))
}

func GetSDInstanceGroups() util.Result[[]graphQLModel.SDInstanceGroup] {
	sdInstanceGroupsLoadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDInstanceGroups()
	if sdInstanceGroupsLoadResult.IsFailure() {
		return util.NewFailureResult[[]graphQLModel.SDInstanceGroup](sdInstanceGroupsLoadResult.GetError())
	}
	return util.NewSuccessResult(util.Map(sdInstanceGroupsLoadResult.GetPayload(), dto2api.SDInstanceGroupDTOToSDInstanceGroup))
}

func CreateSDInstanceGroup(input graphQLModel.SDInstanceGroupInput) util.Result[graphQLModel.SDInstanceGroup] {
	toDTOMappingResult := api2dto.SDInstanceGroupInputToSDInstanceGroupDTO(input)
	if toDTOMappingResult.IsFailure() {
		return util.NewFailureResult[graphQLModel.SDInstanceGroup](toDTOMappingResult.GetError())
	}
	sdInstanceGroupDTO := toDTOMappingResult.GetPayload()
	sdInstanceGroupPersistResult := dbClient.GetRelationalDatabaseClientInstance().PersistSDInstanceGroup(sdInstanceGroupDTO)
	if sdInstanceGroupPersistResult.IsFailure() {
		return util.NewFailureResult[graphQLModel.SDInstanceGroup](sdInstanceGroupPersistResult.GetError())
	}
	sdInstanceGroupDTO.ID = util.NewOptionalOf(sdInstanceGroupPersistResult.GetPayload())
	return util.NewSuccessResult(dto2api.SDInstanceGroupDTOToSDInstanceGroup(sdInstanceGroupDTO))
}

func UpdateSDInstanceGroup(id uint32, input graphQLModel.SDInstanceGroupInput) util.Result[graphQLModel.SDInstanceGroup] {
	toDTOMappingResult := api2dto.SDInstanceGroupInputToSDInstanceGroupDTO(input)
	if toDTOMappingResult.IsFailure() {
		return util.NewFailureResult[graphQLModel.SDInstanceGroup](toDTOMappingResult.GetError())
	}
	sdInstanceGroupDTO := toDTOMappingResult.GetPayload()
	sdInstanceGroupDTO.ID = util.NewOptionalOf(id)
	if sdInstanceGroupPersistResult := dbClient.GetRelationalDatabaseClientInstance().PersistSDInstanceGroup(sdInstanceGroupDTO); sdInstanceGroupPersistResult.IsFailure() {
		return util.NewFailureResult[graphQLModel.SDInstanceGroup](sdInstanceGroupPersistResult.GetError())
	}
	return util.NewSuccessResult(dto2api.SDInstanceGroupDTOToSDInstanceGroup(sdInstanceGroupDTO))
}

func DeleteSDInstanceGroup(id uint32) error {
	return dbClient.GetRelationalDatabaseClientInstance().DeleteSDInstanceGroup(id)
}
