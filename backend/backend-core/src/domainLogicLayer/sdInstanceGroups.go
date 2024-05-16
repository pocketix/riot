package domainLogicLayer

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/modelMapping/dll2gql"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/modelMapping/gql2dll"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func GetSDInstanceGroup(id uint32) util.Result[graphQLModel.SDInstanceGroup] {
	sdInstanceGroupLoadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDInstanceGroup(id)
	if sdInstanceGroupLoadResult.IsFailure() {
		return util.NewFailureResult[graphQLModel.SDInstanceGroup](sdInstanceGroupLoadResult.GetError())
	}
	return util.NewSuccessResult(dll2gql.ToGraphQLModelSDInstanceGroup(sdInstanceGroupLoadResult.GetPayload()))
}

func GetSDInstanceGroups() util.Result[[]graphQLModel.SDInstanceGroup] {
	sdInstanceGroupsLoadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDInstanceGroups()
	if sdInstanceGroupsLoadResult.IsFailure() {
		return util.NewFailureResult[[]graphQLModel.SDInstanceGroup](sdInstanceGroupsLoadResult.GetError())
	}
	return util.NewSuccessResult(util.Map(sdInstanceGroupsLoadResult.GetPayload(), dll2gql.ToGraphQLModelSDInstanceGroup))
}

func CreateSDInstanceGroup(input graphQLModel.SDInstanceGroupInput) util.Result[graphQLModel.SDInstanceGroup] {
	sdInstanceGroup := gql2dll.ToDLLModelSDInstanceGroup(input)
	sdInstanceGroupPersistResult := dbClient.GetRelationalDatabaseClientInstance().PersistSDInstanceGroup(sdInstanceGroup)
	if sdInstanceGroupPersistResult.IsFailure() {
		return util.NewFailureResult[graphQLModel.SDInstanceGroup](sdInstanceGroupPersistResult.GetError())
	}
	sdInstanceGroup.ID = util.NewOptionalOf(sdInstanceGroupPersistResult.GetPayload())
	return util.NewSuccessResult(dll2gql.ToGraphQLModelSDInstanceGroup(sdInstanceGroup))
}

func UpdateSDInstanceGroup(id uint32, input graphQLModel.SDInstanceGroupInput) util.Result[graphQLModel.SDInstanceGroup] {
	sdInstanceGroup := gql2dll.ToDLLModelSDInstanceGroup(input)
	sdInstanceGroup.ID = util.NewOptionalOf(id)
	if sdInstanceGroupPersistResult := dbClient.GetRelationalDatabaseClientInstance().PersistSDInstanceGroup(sdInstanceGroup); sdInstanceGroupPersistResult.IsFailure() {
		return util.NewFailureResult[graphQLModel.SDInstanceGroup](sdInstanceGroupPersistResult.GetError())
	}
	return util.NewSuccessResult(dll2gql.ToGraphQLModelSDInstanceGroup(sdInstanceGroup))
}

func DeleteSDInstanceGroup(id uint32) error {
	return dbClient.GetRelationalDatabaseClientInstance().DeleteSDInstanceGroup(id)
}
