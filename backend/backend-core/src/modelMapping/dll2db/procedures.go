package dll2db

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
)

func ToDBModelEntityVPLProcedure(vplProcedure dllModel.VPLProcedure) dbModel.VPLProceduresEntity {
	return dbModel.VPLProceduresEntity{
		Name: vplProcedure.Name,
		Data: vplProcedure.Data,
	}
}
