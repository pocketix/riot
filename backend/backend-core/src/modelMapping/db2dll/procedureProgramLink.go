package db2dll

import (
	"github.com/pocketix/riot/backend-core/src/model/dbModel"
	"github.com/pocketix/riot/backend-core/src/model/dllModel"
)

func ToDLLModelVplProgramProcedureLink(entity dbModel.VPLProgramProcedureLinkEntity) dllModel.VPLProgramProcedureLink {
	return dllModel.VPLProgramProcedureLink{
		ProgramID:   entity.ProgramID,
		ProcedureID: entity.ProcedureID,
	}
}
