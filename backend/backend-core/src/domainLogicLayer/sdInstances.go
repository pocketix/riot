package domainLogicLayer

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/isc"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/modelMapping/dll2gql"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"

	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/ditto"
	"log"
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

func InvokeSDCommand(id uint32) sharedUtils.Result[bool] {
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDCommandInvocation(id)
	if loadResult.IsFailure() {
		return sharedUtils.NewFailureResult[bool](loadResult.GetError())
	}
	command := loadResult.GetPayload()

	//Ditto client initialization -> just for testing purposes, in the future it will be initialized in a more appropriate way
	dittoCli := ditto.NewDittoClient("http://nginx:8080/api/2", "devops", "foobar")

	//Getting data for Ditto -> thingID, featureID, commandName, payload
	thingID := "cz.riot:shelly30C6F787B4CCC-1" // Jusrt for testing purposes, in the future it will be something like commandInvocation.SDInstance.UniqueIdentifier
	featureID := "relay_0"
	commandName := "toggle" 
	payload := map[string]interface{}{ // The payload can be the data stored in the `commandInvocation` database table or specific parameters
		"status": true, // Example payload, adjust according to your needs
	}

	// Sending to Ditto
	err := dittoCli.SendCommand(thingID, featureID, commandName, payload)
	if err != nil {
		log.Printf("Ditto command dispatch failed: %v\n", err)
		return sharedUtils.NewFailureResult[bool](err)
	}

	invokeResult := dbClient.GetRelationalDatabaseClientInstance().InvokeCommand(command.ID)
	if invokeResult.IsFailure() {
		return sharedUtils.NewFailureResult[bool](invokeResult.GetError())
	}
	return sharedUtils.NewSuccessResult[bool](true)
}

func CreateSDCommand(input graphQLModel.SDCommandInput) sharedUtils.Result[graphQLModel.SDCommand] {
	dllCommand := dll2gql.ToDLLModelSDCommand(input)
	result := dbClient.GetRelationalDatabaseClientInstance().CreateSDCommand(dllCommand)

	if result.IsFailure() {
		return sharedUtils.NewFailureResult[graphQLModel.SDCommand](result.GetError())
	}

	createdID := result.GetPayload()
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDCommand(createdID)
	if loadResult.IsFailure() {
		return sharedUtils.NewFailureResult[graphQLModel.SDCommand](loadResult.GetError())
	}

	return sharedUtils.NewSuccessResult[graphQLModel.SDCommand](dll2gql.ToGraphQLModelSDCommand(loadResult.GetPayload()))
}

func UpdateSDCommand(id uint32, name *string, payload *string) sharedUtils.Result[graphQLModel.SDCommand] {
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDCommand(id)
	if loadResult.IsFailure() {
		return sharedUtils.NewFailureResult[graphQLModel.SDCommand](loadResult.GetError())
	}
	command := loadResult.GetPayload()

	if name != nil {
		command.Name = *name
	}
	if payload != nil {
		command.Payload = *payload
	}

	persistResult := dbClient.GetRelationalDatabaseClientInstance().PersistSDCommand(command)
	if persistResult.IsFailure() {
		return sharedUtils.NewFailureResult[graphQLModel.SDCommand](persistResult.GetError())
	}
	return sharedUtils.NewSuccessResult[graphQLModel.SDCommand](dll2gql.ToGraphQLModelSDCommand(command))
}

func DeleteSDCommand(id uint32) error {
	return dbClient.GetRelationalDatabaseClientInstance().DeleteSDCommand(id)
}

func CreateSDCommandInvocation(input graphQLModel.SDCommandInvocationInput) sharedUtils.Result[graphQLModel.SDCommandInvocation] {
	sdCommandInvocation := dll2gql.ToDLLModelSDCommandInvocation(input)
	persistResult := dbClient.GetRelationalDatabaseClientInstance().PersistSDCommandInvocation(&sdCommandInvocation)
	if persistResult.IsFailure() {
		return sharedUtils.NewFailureResult[graphQLModel.SDCommandInvocation](persistResult.GetError())
	}
	return sharedUtils.NewSuccessResult[graphQLModel.SDCommandInvocation](dll2gql.ToGraphQLModelSDCommandInvocation(sdCommandInvocation))
}

func GetSDCommand(id uint32) sharedUtils.Result[graphQLModel.SDCommand] {
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDCommand(id)
	if loadResult.IsFailure() {
		return sharedUtils.NewFailureResult[graphQLModel.SDCommand](loadResult.GetError())
	}
	return sharedUtils.NewSuccessResult[graphQLModel.SDCommand](dll2gql.ToGraphQLModelSDCommand(loadResult.GetPayload()))
}

func GetSDCommands() sharedUtils.Result[[]graphQLModel.SDCommand] {
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDCommands()
	if loadResult.IsFailure() {
		return sharedUtils.NewFailureResult[[]graphQLModel.SDCommand](loadResult.GetError())
	}
	return sharedUtils.NewSuccessResult[[]graphQLModel.SDCommand](sharedUtils.Map(loadResult.GetPayload(), dll2gql.ToGraphQLModelSDCommand))
}

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
	return sharedUtils.NewSuccessResult[[]graphQLModel.SDCommandInvocation](sharedUtils.Map(loadResult.GetPayload(), dll2gql.ToGraphQLModelSDCommandInvocation))
}
