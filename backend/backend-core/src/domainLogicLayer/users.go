package domainLogicLayer

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/modelMapping/dll2gql"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/modelMapping/gql2dll"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

func GetUserConfig(id uint32) sharedUtils.Result[graphQLModel.UserConfig] {
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadUserConfig(id)
	if loadResult.IsFailure() {
		return sharedUtils.NewFailureResult[graphQLModel.UserConfig](loadResult.GetError())
	}
	return sharedUtils.NewSuccessResult[graphQLModel.UserConfig](dll2gql.ToGraphQLModelUserConfig(loadResult.GetPayload()))
}

func UpdateUserConfig(id uint32, input graphQLModel.UserConfigInput) sharedUtils.Result[graphQLModel.UserConfig] {
	userConfig := gql2dll.ToDLLModelUserConfig(input)
	userConfig.UserID = id
	if sdInstanceGroupPersistResult := dbClient.GetRelationalDatabaseClientInstance().PersistUserConfig(userConfig); sdInstanceGroupPersistResult.IsFailure() {
		return sharedUtils.NewFailureResult[graphQLModel.UserConfig](sdInstanceGroupPersistResult.GetError())
	}
	return sharedUtils.NewSuccessResult(dll2gql.ToGraphQLModelUserConfig(userConfig))
}

func DeleteUserConfig(id uint32) error {
	return dbClient.GetRelationalDatabaseClientInstance().DeleteUserConfig(id)
}
