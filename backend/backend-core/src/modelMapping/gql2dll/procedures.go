package gql2dll

import (

	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
)

func ToDLLModelVPLProcedure(input graphQLModel.VPLProcedureInput) dllModel.VPLProcedure {
	return dllModel.VPLProcedure{
		ID:        0, 
		Name:      input.Name,
		Data:      input.Data,
	}
}
