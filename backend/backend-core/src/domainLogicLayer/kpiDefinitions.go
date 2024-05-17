package domainLogicLayer

import (
	"errors"
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/isc"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/modelMapping/dll2gql"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/modelMapping/gql2dll"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func CreateKPIDefinition(kpiDefinitionInput graphQLModel.KPIDefinitionInput) util.Result[graphQLModel.KPIDefinition] {
	toDLLModelTransformResult := gql2dll.ToDLLModelKPIDefinition(kpiDefinitionInput)
	if toDLLModelTransformResult.IsFailure() {
		return util.NewFailureResult[graphQLModel.KPIDefinition](toDLLModelTransformResult.GetError())
	}
	kpiDefinition := toDLLModelTransformResult.GetPayload()
	persistResult := dbClient.GetRelationalDatabaseClientInstance().PersistKPIDefinition(kpiDefinition)
	if persistResult.IsFailure() {
		return util.NewFailureResult[graphQLModel.KPIDefinition](persistResult.GetError())
	}
	go isc.EnqueueMessageRepresentingCurrentKPIDefinitionConfiguration()
	id := persistResult.GetPayload()
	kpiDefinition.ID = &id
	return util.NewSuccessResult[graphQLModel.KPIDefinition](dll2gql.ToGraphQLModelKPIDefinition(kpiDefinition))
}

func UpdateKPIDefinition(id uint32, kpiDefinitionInput graphQLModel.KPIDefinitionInput) util.Result[graphQLModel.KPIDefinition] {
	// TODO: Performing deletion followed by re-insertion instead of update on the data layer (suboptimal)
	if err := dbClient.GetRelationalDatabaseClientInstance().DeleteKPIDefinition(id); err != nil {
		return util.NewFailureResult[graphQLModel.KPIDefinition](err)
	}
	toDLLModelTransformResult := gql2dll.ToDLLModelKPIDefinition(kpiDefinitionInput)
	if toDLLModelTransformResult.IsFailure() {
		return util.NewFailureResult[graphQLModel.KPIDefinition](toDLLModelTransformResult.GetError())
	}
	kpiDefinition := toDLLModelTransformResult.GetPayload()
	kpiDefinition.ID = &id
	persistResult := dbClient.GetRelationalDatabaseClientInstance().PersistKPIDefinition(kpiDefinition)
	if persistResult.IsFailure() {
		return util.NewFailureResult[graphQLModel.KPIDefinition](persistResult.GetError())
	}
	go isc.EnqueueMessageRepresentingCurrentKPIDefinitionConfiguration()
	return util.NewSuccessResult[graphQLModel.KPIDefinition](dll2gql.ToGraphQLModelKPIDefinition(kpiDefinition))
}

func DeleteKPIDefinition(id uint32) error {
	if err := dbClient.GetRelationalDatabaseClientInstance().DeleteKPIDefinition(id); err != nil {
		return err
	}
	go isc.EnqueueMessageRepresentingCurrentKPIDefinitionConfiguration()
	return nil
}

func GetKPIDefinitions() util.Result[[]graphQLModel.KPIDefinition] {
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadKPIDefinitions()
	if loadResult.IsFailure() {
		return util.NewFailureResult[[]graphQLModel.KPIDefinition](loadResult.GetError())
	}
	return util.NewSuccessResult[[]graphQLModel.KPIDefinition](util.Map(loadResult.GetPayload(), dll2gql.ToGraphQLModelKPIDefinition))
}

func GetKPIDefinition(id uint32) util.Result[graphQLModel.KPIDefinition] {
	// TODO: Searching for target KPI definition on business-logic layer (suboptimal)
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadKPIDefinitions()
	if loadResult.IsFailure() {
		return util.NewFailureResult[graphQLModel.KPIDefinition](loadResult.GetError())
	}
	kpiDefinitions := loadResult.GetPayload()
	targetKPIDefinitionOptional := util.FindFirst[sharedModel.KPIDefinition](kpiDefinitions, func(kpiDefinition sharedModel.KPIDefinition) bool {
		return *kpiDefinition.ID == id
	})
	if targetKPIDefinitionOptional.IsEmpty() {
		return util.NewFailureResult[graphQLModel.KPIDefinition](errors.New(fmt.Sprintf("couldn't find KPI definition for id: %d", id)))
	}
	return util.NewSuccessResult[graphQLModel.KPIDefinition](dll2gql.ToGraphQLModelKPIDefinition(targetKPIDefinitionOptional.GetPayload()))
}
