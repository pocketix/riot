package domainLogicLayer

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/isc"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/modelMapping/dll2gql"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

func GetSDInstances() sharedUtils.Result[[]graphQLModel.SDInstance] {
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDInstances()
	if loadResult.IsFailure() {
		return sharedUtils.NewFailureResult[[]graphQLModel.SDInstance](loadResult.GetError())
	}
	return sharedUtils.NewSuccessResult[[]graphQLModel.SDInstance](sharedUtils.Map(loadResult.GetPayload(), dll2gql.ToGraphQLModelSDInstance))
}

func UpdateSDInstance(id uint32, sdInstanceUpdateInput graphQLModel.SDInstanceUpdateInput) sharedUtils.Result[graphQLModel.SDInstance] {
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDInstance(id)
	if loadResult.IsFailure() {
		return sharedUtils.NewFailureResult[graphQLModel.SDInstance](loadResult.GetError())
	}
	sdInstance := loadResult.GetPayload()
	sharedUtils.NewOptionalFromPointer(sdInstanceUpdateInput.UserIdentifier).DoIfPresent(func(userIdentifier string) {
		sdInstance.UserIdentifier = userIdentifier
	})
	sharedUtils.NewOptionalFromPointer(sdInstanceUpdateInput.ConfirmedByUser).DoIfPresent(func(confirmedByUser bool) {
		sdInstance.ConfirmedByUser = confirmedByUser
	})
	if persistResult := dbClient.GetRelationalDatabaseClientInstance().PersistSDInstance(sdInstance); persistResult.IsFailure() {
		return sharedUtils.NewFailureResult[graphQLModel.SDInstance](persistResult.GetError())
	}
	isc.EnqueueMessageRepresentingCurrentSDInstanceConfiguration(getDLLRabbitMQClient())
	return sharedUtils.NewSuccessResult[graphQLModel.SDInstance](dll2gql.ToGraphQLModelSDInstance(sdInstance))
}

// Still fucked
func GetSDCommandInvocation(id uint32) sharedUtils.Result[graphQLModel.SDCommandInvocation] {
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDCommandInvocation(id)
	if loadResult.IsFailure() {
		return sharedUtils.NewFailureResult[graphQLModel.SDCommandInvocation](loadResult.GetError())
	}
	return sharedUtils.NewSuccessResult[graphQLModel.SDCommandInvocation](dll2gql.ToGraphQLModelSDCommandInvocation(loadResult.GetPayload()))
}

func GetSDCommandInvocations() sharedUtils.Result[[]graphQLModel.SDCommandInvocation] {
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDCommandInvocations()
	if loadResult.IsFailure() {
		return sharedUtils.NewFailureResult[[]graphQLModel.SDCommandInvocation](loadResult.GetError())
	}
	return sharedUtils.NewSuccessResult[[]graphQLModel.SDCommandInvocation](dll2gql.ToGraphQLModelSDCommandInvocations(loadResult.GetPayload()))
}

func CreateSDCommandInvocation(input graphQLModel.SDCommandInvocationInput) sharedUtils.Result[graphQLModel.SDCommandInvocation] {
	sdCommandInvocation := dll2gql.ToDLLModelSDCommandInvocation(input)
	persistResult := dbClient.GetRelationalDatabaseClientInstance().PersistSDCommandInvocation(&sdCommandInvocation)
	if persistResult.IsFailure() {
		return sharedUtils.NewFailureResult[graphQLModel.SDCommandInvocation](persistResult.GetError())
	}
	return sharedUtils.NewSuccessResult[graphQLModel.SDCommandInvocation](dll2gql.ToGraphQLModelSDCommandInvocation(sdCommandInvocation))
}

func InvokeSDCommand(id uint32) sharedUtils.Result[bool] {
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDCommandInvocation(id)
	if loadResult.IsFailure() {
		return sharedUtils.NewFailureResult[bool](loadResult.GetError())
	}
	command := loadResult.GetPayload()
	invokeResult := dbClient.GetRelationalDatabaseClientInstance().InvokeCommand(command.ID)
	if invokeResult.IsFailure() {
		return sharedUtils.NewFailureResult[bool](invokeResult.GetError())
	}
	return sharedUtils.NewSuccessResult[bool](true)
}
