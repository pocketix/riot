package domainLogicLayer

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/isc"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/modelMapping/dll2gql"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"

	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/ditto"
	"log"
	"fmt"
	"strings"
	"encoding/json"
)
type CommandPayload struct {
	FeatureID string      `json:"featureId"`
	Action    string      `json:"action"`
	Value     interface{} `json:"value"`
}

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

	wasAlreadyConfirmed := sdInstance.ConfirmedByUser

	sharedUtils.NewOptionalFromPointer(sdInstanceUpdateInput.UserIdentifier).DoIfPresent(func(userIdentifier string) {
		sdInstance.UserIdentifier = userIdentifier
	})
	sharedUtils.NewOptionalFromPointer(sdInstanceUpdateInput.ConfirmedByUser).DoIfPresent(func(confirmedByUser bool) {
		sdInstance.ConfirmedByUser = confirmedByUser
	})

	if persistResult := dbClient.GetRelationalDatabaseClientInstance().PersistSDInstance(sdInstance); persistResult.IsFailure() {
		return sharedUtils.NewFailureResult[graphQLModel.SDInstance](persistResult.GetError())
	}

	if sdInstance.ConfirmedByUser && !wasAlreadyConfirmed {
		dittoCli := ditto.NewDittoClientFromEnvironment()
		thingID := fmt.Sprintf("cz.riot:%s", sdInstance.UID)

		log.Printf("[Ditto] Device %s was approved. Creating digital twin...\n", thingID)

		features := make(map[string]interface{})
		snapshotValues := make(map[uint32]interface{})

		for _, snap := range sdInstance.ParameterSnapshots {
			var val interface{}

			snap.Number.DoIfPresent(func(v float64) {
				val = v
			})
			snap.Boolean.DoIfPresent(func(v bool) {
				val = v
			})
			snap.String.DoIfPresent(func(v string) {
				val = v
			})

			if val != nil {
				snapshotValues[snap.SDParameter] = val
			}
		}

		
		for _, param := range sdInstance.SDType.Parameters {
			var paramID uint32
			var hasParamID bool

			param.ID.DoIfPresent(func(id uint32) {
				paramID = id
				hasParamID = true
			})

			if !hasParamID {
				continue
			}

			lastUnderscore := strings.LastIndex(param.Denotation, "_")
			if lastUnderscore == -1 {
				continue
			}

			featureName := param.Denotation[:lastUnderscore]
			propertyName := param.Denotation[lastUnderscore+1:]

			if _, ok := features[featureName]; !ok {
				features[featureName] = map[string]interface{}{
					"properties": make(map[string]interface{}),
				}
			}

			var finalVal interface{} = nil
			if snapVal, exists := snapshotValues[paramID]; exists {
				finalVal = snapVal
			}

			featureMap := features[featureName].(map[string]interface{})
			propertiesMap := featureMap["properties"].(map[string]interface{})
			propertiesMap[propertyName] = finalVal
		}

		err := dittoCli.CreateThing(thingID, features)
		if err != nil {
			log.Printf("[Ditto] ERROR while creating digital twin: %v\n", err)
		} else {
			log.Printf("[Ditto] Digital twin %s was successfully created!\n", thingID)
		}
	}

	isc.EnqueueMessageRepresentingCurrentSDInstanceConfiguration(getDLLRabbitMQClient())
	return sharedUtils.NewSuccessResult[graphQLModel.SDInstance](dll2gql.ToGraphQLModelSDInstance(sdInstance))
}

func InvokeSDCommand(id uint32) sharedUtils.Result[bool] {
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDCommandInvocation(id)
	if loadResult.IsFailure() {
		return sharedUtils.NewFailureResult[bool](loadResult.GetError())
	}
	commandInvocation := loadResult.GetPayload()

		instanceLoadResult := dbClient.GetRelationalDatabaseClientInstance().LoadSDInstance(commandInvocation.SDInstanceID)
	if instanceLoadResult.IsFailure() {
		return sharedUtils.NewFailureResult[bool](instanceLoadResult.GetError())
	}
	sdInstance := instanceLoadResult.GetPayload()
	
	thingID := fmt.Sprintf("cz.riot:%s", sdInstance.UID)

		var cmdPayload CommandPayload
	if err := json.Unmarshal([]byte(commandInvocation.Payload), &cmdPayload); err != nil {
		log.Printf("Failed to unmarshal command payload: %v\n", err)
		return sharedUtils.NewFailureResult[bool](err)
	}

	dittoCli := ditto.NewDittoClientFromEnvironment()

	log.Printf("[Ditto] Dispatching command to %s: Feature=%s, Action=%s\n", thingID, cmdPayload.FeatureID, cmdPayload.Action)

	err := dittoCli.SendCommand(thingID, cmdPayload.FeatureID, cmdPayload.Action, cmdPayload.Value)
	if err != nil {
		log.Printf("Ditto command dispatch failed: %v\n", err)
		return sharedUtils.NewFailureResult[bool](err)
	}

	invokeResult := dbClient.GetRelationalDatabaseClientInstance().InvokeCommand(commandInvocation.ID)
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
