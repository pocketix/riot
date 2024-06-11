package domainLogicLayer

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/modelMapping/dll2gql"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/modelMapping/gql2dll"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

func GetSDInstanceGroup(id uint32) sharedUtils.Result[graphQLModel.SDInstanceGroup] {
	sdInstanceGroupLoadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDInstanceGroup(id)
	if sdInstanceGroupLoadResult.IsFailure() {
		return sharedUtils.NewFailureResult[graphQLModel.SDInstanceGroup](sdInstanceGroupLoadResult.GetError())
	}
	return sharedUtils.NewSuccessResult(dll2gql.ToGraphQLModelSDInstanceGroup(sdInstanceGroupLoadResult.GetPayload()))
}

func GetSDInstanceGroups() sharedUtils.Result[[]graphQLModel.SDInstanceGroup] {
	sdInstanceGroupsLoadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDInstanceGroups()
	if sdInstanceGroupsLoadResult.IsFailure() {
		return sharedUtils.NewFailureResult[[]graphQLModel.SDInstanceGroup](sdInstanceGroupsLoadResult.GetError())
	}
	return sharedUtils.NewSuccessResult(sharedUtils.Map(sdInstanceGroupsLoadResult.GetPayload(), dll2gql.ToGraphQLModelSDInstanceGroup))
}

func CreateSDInstanceGroup(input graphQLModel.SDInstanceGroupInput) sharedUtils.Result[graphQLModel.SDInstanceGroup] {
	sdInstanceGroup := gql2dll.ToDLLModelSDInstanceGroup(input)
	sdInstanceGroupPersistResult := dbClient.GetRelationalDatabaseClientInstance().PersistSDInstanceGroup(sdInstanceGroup)
	if sdInstanceGroupPersistResult.IsFailure() {
		return sharedUtils.NewFailureResult[graphQLModel.SDInstanceGroup](sdInstanceGroupPersistResult.GetError())
	}
	sdInstanceGroup.ID = sharedUtils.NewOptionalOf(sdInstanceGroupPersistResult.GetPayload())
	return sharedUtils.NewSuccessResult(dll2gql.ToGraphQLModelSDInstanceGroup(sdInstanceGroup))
}

func UpdateSDInstanceGroup(id uint32, input graphQLModel.SDInstanceGroupInput) sharedUtils.Result[graphQLModel.SDInstanceGroup] {
	sdInstanceGroup := gql2dll.ToDLLModelSDInstanceGroup(input)
	sdInstanceGroup.ID = sharedUtils.NewOptionalOf(id)
	if sdInstanceGroupPersistResult := dbClient.GetRelationalDatabaseClientInstance().PersistSDInstanceGroup(sdInstanceGroup); sdInstanceGroupPersistResult.IsFailure() {
		return sharedUtils.NewFailureResult[graphQLModel.SDInstanceGroup](sdInstanceGroupPersistResult.GetError())
	}
	return sharedUtils.NewSuccessResult(dll2gql.ToGraphQLModelSDInstanceGroup(sdInstanceGroup))
}

func DeleteSDInstanceGroup(id uint32) error {
	return dbClient.GetRelationalDatabaseClientInstance().DeleteSDInstanceGroup(id)
}
