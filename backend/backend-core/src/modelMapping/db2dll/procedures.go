package db2dll

import (
	"github.com/pocketix/riot/backend-core/src/model/dbModel"
	"github.com/pocketix/riot/backend-core/src/model/dllModel"
)

func ToDLLModelVplProcedure(entity dbModel.VPLProceduresEntity) dllModel.VPLProcedure {
	return dllModel.VPLProcedure{
		ID:   entity.ID,
		Name: entity.Name,
		Data: entity.Data,
	}
}
