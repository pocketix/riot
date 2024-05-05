package service

import (
	"errors"
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/api/graphql/model"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/mapping/api2dto"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/mapping/dto2api"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/kpi"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func CreateKPIDefinition(kpiDefinitionInput model.KPIDefinitionInput) util.Result[*model.KPIDefinition] {
	toDTOTransformResult := api2dto.KPIDefinitionInputToKPIDefinitionDTO(kpiDefinitionInput)
	if toDTOTransformResult.IsFailure() {
		return util.NewFailureResult[*model.KPIDefinition](toDTOTransformResult.GetError())
	}
	kpiDefinitionDTO := toDTOTransformResult.GetPayload()
	persistResult := (*db.GetRelationalDatabaseClientInstance()).PersistKPIDefinition(kpiDefinitionDTO)
	if persistResult.IsFailure() {
		return util.NewFailureResult[*model.KPIDefinition](persistResult.GetError())
	}
	go func() {
		util.LogPossibleErrorThenProceed(EnqueueMessageRepresentingCurrentKPIDefinitions(), "Failed to enqueue message representing current KPI definitions in the system")
	}()
	id := persistResult.GetPayload()
	kpiDefinitionDTO.ID = util.NewOptionalOf[uint32](id)
	kpiDefinition := dto2api.KPIDefinitionDTOToKPIDefinition(kpiDefinitionDTO)
	return util.NewSuccessResult[*model.KPIDefinition](kpiDefinition)
}

func UpdateKPIDefinition(stringID string, kpiDefinitionInput model.KPIDefinitionInput) util.Result[*model.KPIDefinition] {
	uint32FromStringResult := util.UINT32FromString(stringID)
	if uint32FromStringResult.IsFailure() {
		return util.NewFailureResult[*model.KPIDefinition](uint32FromStringResult.GetError())
	}
	id := uint32FromStringResult.GetPayload()
	// TODO: Performing deletion followed by re-insertion instead of update on the data layer (suboptimal)
	if err := (*db.GetRelationalDatabaseClientInstance()).DeleteKPIDefinition(id); err != nil {
		return util.NewFailureResult[*model.KPIDefinition](err)
	}
	toDTOTransformResult := api2dto.KPIDefinitionInputToKPIDefinitionDTO(kpiDefinitionInput)
	if toDTOTransformResult.IsFailure() {
		return util.NewFailureResult[*model.KPIDefinition](toDTOTransformResult.GetError())
	}
	kpiDefinitionDTO := toDTOTransformResult.GetPayload()
	kpiDefinitionDTO.ID = util.NewOptionalOf(id)
	persistResult := (*db.GetRelationalDatabaseClientInstance()).PersistKPIDefinition(kpiDefinitionDTO)
	if persistResult.IsFailure() {
		return util.NewFailureResult[*model.KPIDefinition](persistResult.GetError())
	}
	go func() {
		util.LogPossibleErrorThenProceed(EnqueueMessageRepresentingCurrentKPIDefinitions(), "Failed to enqueue message representing current KPI definitions in the system")
	}()
	kpiDefinition := dto2api.KPIDefinitionDTOToKPIDefinition(kpiDefinitionDTO)
	return util.NewSuccessResult[*model.KPIDefinition](kpiDefinition)
}

func GetKPIDefinitions() util.Result[[]*model.KPIDefinition] {
	loadResult := (*db.GetRelationalDatabaseClientInstance()).LoadKPIDefinitions()
	if loadResult.IsFailure() {
		return util.NewFailureResult[[]*model.KPIDefinition](loadResult.GetError())
	}
	return util.NewSuccessResult[[]*model.KPIDefinition](util.Map(loadResult.GetPayload(), dto2api.KPIDefinitionDTOToKPIDefinition))
}

func GetKPIDefinition(stringID string) util.Result[*model.KPIDefinition] {
	uint32FromStringResult := util.UINT32FromString(stringID)
	if uint32FromStringResult.IsFailure() {
		return util.NewFailureResult[*model.KPIDefinition](uint32FromStringResult.GetError())
	}
	id := uint32FromStringResult.GetPayload()
	// TODO: Searching for target KPI definition on service layer (suboptimal)
	loadResult := (*db.GetRelationalDatabaseClientInstance()).LoadKPIDefinitions()
	if loadResult.IsFailure() {
		return util.NewFailureResult[*model.KPIDefinition](loadResult.GetError())
	}
	kpiDefinitionDTOs := loadResult.GetPayload()
	targetKPIDefinitionDTOOptional := util.FindFirst[kpi.DefinitionDTO](kpiDefinitionDTOs, func(kpiDefinitionDTO kpi.DefinitionDTO) bool {
		return kpiDefinitionDTO.ID.GetPayload() == id
	})
	if targetKPIDefinitionDTOOptional.IsEmpty() {
		return util.NewFailureResult[*model.KPIDefinition](errors.New(fmt.Sprintf("couldn't find KPI definition for id: %d", id)))
	}
	return util.NewSuccessResult[*model.KPIDefinition](dto2api.KPIDefinitionDTOToKPIDefinition(targetKPIDefinitionDTOOptional.GetPayload()))
}
