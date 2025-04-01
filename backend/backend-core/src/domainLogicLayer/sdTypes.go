package domainLogicLayer

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/isc"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/modelMapping/dll2gql"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/modelMapping/gql2dll"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

func CreateSDType(sdTypeInput graphQLModel.SDTypeInput) sharedUtils.Result[graphQLModel.SDType] {
	sdType := gql2dll.ToDLLModelSDType(sdTypeInput)
	persistResult := dbClient.GetRelationalDatabaseClientInstance().PersistSDType(sdType)
	if persistResult.IsFailure() {
		return sharedUtils.NewFailureResult[graphQLModel.SDType](persistResult.GetError())
	}
	isc.EnqueueMessageRepresentingCurrentSDTypeConfiguration(getDLLRabbitMQClient())
	return sharedUtils.NewSuccessResult[graphQLModel.SDType](dll2gql.ToGraphQLModelSDType(persistResult.GetPayload()))
}

func UpdateSDType(id uint32, sdTypeInput graphQLModel.SDTypeInput) sharedUtils.Result[graphQLModel.SDType] {
	sdType := gql2dll.ToDLLModelSDType(sdTypeInput)

	sdType.ID = sharedUtils.NewOptionalOf(id)

	persistResult := dbClient.GetRelationalDatabaseClientInstance().PersistSDType(sdType)
	if persistResult.IsFailure() {
		return sharedUtils.NewFailureResult[graphQLModel.SDType](persistResult.GetError())
	}
	isc.EnqueueMessageRepresentingCurrentSDTypeConfiguration(getDLLRabbitMQClient())
	return sharedUtils.NewSuccessResult[graphQLModel.SDType](dll2gql.ToGraphQLModelSDType(persistResult.GetPayload()))
}

func DeleteSDType(id uint32) error {
	if err := dbClient.GetRelationalDatabaseClientInstance().DeleteSDType(id); err != nil {
		return err
	}
	isc.EnqueueMessagesRepresentingCurrentSystemConfiguration(getDLLRabbitMQClient())
	return nil
}

func GetSDType(id uint32) sharedUtils.Result[graphQLModel.SDType] {
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDType(id)
	if loadResult.IsFailure() {
		return sharedUtils.NewFailureResult[graphQLModel.SDType](loadResult.GetError())
	}
	return sharedUtils.NewSuccessResult[graphQLModel.SDType](dll2gql.ToGraphQLModelSDType(loadResult.GetPayload()))
}

func GetSDTypes() sharedUtils.Result[[]graphQLModel.SDType] {
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDTypes()
	if loadResult.IsFailure() {
		return sharedUtils.NewFailureResult[[]graphQLModel.SDType](loadResult.GetError())
	}
	return sharedUtils.NewSuccessResult[[]graphQLModel.SDType](sharedUtils.Map(loadResult.GetPayload(), dll2gql.ToGraphQLModelSDType))
}
