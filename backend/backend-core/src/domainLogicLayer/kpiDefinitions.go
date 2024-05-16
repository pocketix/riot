package domainLogicLayer

import (
	"errors"
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/isc"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/mapping/api2dto"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/mapping/dto2api"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/kpi"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func CreateKPIDefinition(kpiDefinitionInput graphQLModel.KPIDefinitionInput) util.Result[graphQLModel.KPIDefinition] {
	toDTOTransformResult := api2dto.KPIDefinitionInputToKPIDefinitionDTO(kpiDefinitionInput)
	if toDTOTransformResult.IsFailure() {
		return util.NewFailureResult[graphQLModel.KPIDefinition](toDTOTransformResult.GetError())
	}
	kpiDefinitionDTO := toDTOTransformResult.GetPayload()
	persistResult := dbClient.GetRelationalDatabaseClientInstance().PersistKPIDefinition(kpiDefinitionDTO)
	if persistResult.IsFailure() {
		return util.NewFailureResult[graphQLModel.KPIDefinition](persistResult.GetError())
	}
	go isc.EnqueueMessageRepresentingCurrentKPIDefinitionConfiguration()
	id := persistResult.GetPayload()
	kpiDefinitionDTO.ID = util.NewOptionalOf[uint32](id)
	return util.NewSuccessResult[graphQLModel.KPIDefinition](dto2api.KPIDefinitionDTOToKPIDefinition(kpiDefinitionDTO))
}

func UpdateKPIDefinition(id uint32, kpiDefinitionInput graphQLModel.KPIDefinitionInput) util.Result[graphQLModel.KPIDefinition] {
	// TODO: Performing deletion followed by re-insertion instead of update on the data layer (suboptimal)
	if err := dbClient.GetRelationalDatabaseClientInstance().DeleteKPIDefinition(id); err != nil {
		return util.NewFailureResult[graphQLModel.KPIDefinition](err)
	}
	toDTOTransformResult := api2dto.KPIDefinitionInputToKPIDefinitionDTO(kpiDefinitionInput)
	if toDTOTransformResult.IsFailure() {
		return util.NewFailureResult[graphQLModel.KPIDefinition](toDTOTransformResult.GetError())
	}
	kpiDefinitionDTO := toDTOTransformResult.GetPayload()
	kpiDefinitionDTO.ID = util.NewOptionalOf(id)
	persistResult := dbClient.GetRelationalDatabaseClientInstance().PersistKPIDefinition(kpiDefinitionDTO)
	if persistResult.IsFailure() {
		return util.NewFailureResult[graphQLModel.KPIDefinition](persistResult.GetError())
	}
	go isc.EnqueueMessageRepresentingCurrentKPIDefinitionConfiguration()
	kpiDefinition := dto2api.KPIDefinitionDTOToKPIDefinition(kpiDefinitionDTO)
	return util.NewSuccessResult[graphQLModel.KPIDefinition](kpiDefinition)
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
	return util.NewSuccessResult[[]graphQLModel.KPIDefinition](util.Map(loadResult.GetPayload(), dto2api.KPIDefinitionDTOToKPIDefinition))
}

func GetKPIDefinition(id uint32) util.Result[graphQLModel.KPIDefinition] {
	// TODO: Searching for target KPI definition on business-logic layer (suboptimal)
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadKPIDefinitions()
	if loadResult.IsFailure() {
		return util.NewFailureResult[graphQLModel.KPIDefinition](loadResult.GetError())
	}
	kpiDefinitionDTOs := loadResult.GetPayload()
	targetKPIDefinitionDTOOptional := util.FindFirst[kpi.DefinitionDTO](kpiDefinitionDTOs, func(kpiDefinitionDTO kpi.DefinitionDTO) bool {
		return kpiDefinitionDTO.ID.GetPayload() == id
	})
	if targetKPIDefinitionDTOOptional.IsEmpty() {
		return util.NewFailureResult[graphQLModel.KPIDefinition](errors.New(fmt.Sprintf("couldn't find KPI definition for id: %d", id)))
	}
	return util.NewSuccessResult[graphQLModel.KPIDefinition](dto2api.KPIDefinitionDTOToKPIDefinition(targetKPIDefinitionDTOOptional.GetPayload()))
}
