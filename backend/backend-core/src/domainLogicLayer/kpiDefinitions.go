package domainLogicLayer

import (
	"errors"
	"fmt"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/isc"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/modelMapping/dll2gql"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/modelMapping/gql2dll"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

func CreateKPIDefinition(kpiDefinitionInput graphQLModel.KPIDefinitionInput) sharedUtils.Result[graphQLModel.KPIDefinition] {
	toDLLModelTransformResult := gql2dll.ToDLLModelKPIDefinition(kpiDefinitionInput)
	if toDLLModelTransformResult.IsFailure() {
		return sharedUtils.NewFailureResult[graphQLModel.KPIDefinition](toDLLModelTransformResult.GetError())
	}
	kpiDefinition := toDLLModelTransformResult.GetPayload()
	persistResult := dbClient.GetRelationalDatabaseClientInstance().PersistKPIDefinition(kpiDefinition)
	if persistResult.IsFailure() {
		return sharedUtils.NewFailureResult[graphQLModel.KPIDefinition](persistResult.GetError())
	}
	isc.EnqueueMessageRepresentingCurrentKPIDefinitionConfiguration(getDLLRabbitMQClient())
	id := persistResult.GetPayload()
	kpiDefinition.ID = &id
	return sharedUtils.NewSuccessResult[graphQLModel.KPIDefinition](dll2gql.ToGraphQLModelKPIDefinition(kpiDefinition))
}

func UpdateKPIDefinition(id uint32, kpiDefinitionInput graphQLModel.KPIDefinitionInput) sharedUtils.Result[graphQLModel.KPIDefinition] {
	toDLLModelTransformResult := gql2dll.ToDLLModelKPIDefinition(kpiDefinitionInput)
	if toDLLModelTransformResult.IsFailure() {
		return sharedUtils.NewFailureResult[graphQLModel.KPIDefinition](toDLLModelTransformResult.GetError())
	}
	kpiDefinition := toDLLModelTransformResult.GetPayload()
	kpiDefinition.ID = &id
	persistResult := dbClient.GetRelationalDatabaseClientInstance().PersistKPIDefinition(kpiDefinition)
	if persistResult.IsFailure() {
		return sharedUtils.NewFailureResult[graphQLModel.KPIDefinition](persistResult.GetError())
	}
	isc.EnqueueMessageRepresentingCurrentKPIDefinitionConfiguration(getDLLRabbitMQClient())
	return sharedUtils.NewSuccessResult[graphQLModel.KPIDefinition](dll2gql.ToGraphQLModelKPIDefinition(kpiDefinition))
}

func DeleteKPIDefinition(id uint32) error {
	if err := dbClient.GetRelationalDatabaseClientInstance().DeleteKPIDefinition(id); err != nil {
		return err
	}
	isc.EnqueueMessageRepresentingCurrentKPIDefinitionConfiguration(getDLLRabbitMQClient())
	return nil
}

func GetKPIDefinitions() sharedUtils.Result[[]graphQLModel.KPIDefinition] {
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadKPIDefinitions()
	if loadResult.IsFailure() {
		return sharedUtils.NewFailureResult[[]graphQLModel.KPIDefinition](loadResult.GetError())
	}
	return sharedUtils.NewSuccessResult[[]graphQLModel.KPIDefinition](sharedUtils.Map(loadResult.GetPayload(), dll2gql.ToGraphQLModelKPIDefinition))
}

func GetKPIDefinition(id uint32) sharedUtils.Result[graphQLModel.KPIDefinition] {
	// TODO: Searching for target KPI definition on business-logic layer (suboptimal)
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadKPIDefinitions()
	if loadResult.IsFailure() {
		return sharedUtils.NewFailureResult[graphQLModel.KPIDefinition](loadResult.GetError())
	}
	kpiDefinitions := loadResult.GetPayload()
	targetKPIDefinitionOptional := sharedUtils.FindFirst[sharedModel.KPIDefinition](kpiDefinitions, func(kpiDefinition sharedModel.KPIDefinition) bool {
		return *kpiDefinition.ID == id
	})
	if targetKPIDefinitionOptional.IsEmpty() {
		return sharedUtils.NewFailureResult[graphQLModel.KPIDefinition](errors.New(fmt.Sprintf("couldn't find KPI definition for id: %d", id)))
	}
	return sharedUtils.NewSuccessResult[graphQLModel.KPIDefinition](dll2gql.ToGraphQLModelKPIDefinition(targetKPIDefinitionOptional.GetPayload()))
}
