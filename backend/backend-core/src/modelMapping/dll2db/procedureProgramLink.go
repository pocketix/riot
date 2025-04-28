package dll2db

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
)

func ToDBModelEntityVPLProgramProcedureLink(link dllModel.VPLProgramProcedureLink) dbModel.VPLProgramProcedureLinkEntity {
	return dbModel.VPLProgramProcedureLinkEntity{
		ProgramID:   link.ProgramID,
		ProcedureID: link.ProcedureID,
	}
}
