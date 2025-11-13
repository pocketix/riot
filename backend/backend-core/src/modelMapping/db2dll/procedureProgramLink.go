package db2dll

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
)

func ToDLLModelVplProgramProcedureLink(entity dbModel.VPLProgramProcedureLinkEntity) dllModel.VPLProgramProcedureLink {
	return dllModel.VPLProgramProcedureLink{
		ProgramID:   entity.ProgramID,
		ProcedureID: entity.ProcedureID,
	}
}
