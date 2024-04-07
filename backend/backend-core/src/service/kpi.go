package service

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/api/graphql/model"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/mapping/api2dto"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/mapping/dto2api"
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
	id := persistResult.GetPayload()
	kpiDefinitionDTO.ID = util.NewOptionalOf[uint32](id)
	kpiDefinition := dto2api.KPIDefinitionDTOToKPIDefinition(kpiDefinitionDTO)
	return util.NewSuccessResult[*model.KPIDefinition](kpiDefinition)
}
