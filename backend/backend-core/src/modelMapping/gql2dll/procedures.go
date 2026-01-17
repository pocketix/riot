package gql2dll

import (
	"github.com/pocketix/riot/backend-core/src/model/dllModel"
	"github.com/pocketix/riot/backend-core/src/model/graphQLModel"
)

func ToDLLModelVPLProcedure(vplProcedure graphQLModel.VPLProcedure) dllModel.VPLProcedure {
	return dllModel.VPLProcedure{
		ID:   vplProcedure.ID,
		Name: vplProcedure.Name,
		Data: vplProcedure.Data,
	}
}
