package dll2gql

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
)

func ToGraphQLModelVPLProcedure(vplProcedure dllModel.VPLProcedure) graphQLModel.VPLProcedure {
	return graphQLModel.VPLProcedure{
		Name: vplProcedure.Name,
		Data: vplProcedure.Data,
	}
}
