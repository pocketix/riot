package dll2gql

import (

	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
)

func ToGraphQLModelVPLProcedure(vplProcedure dllModel.VPLProcedure) graphQLModel.VPLProcedure {
	// The Programs field will be populated by the resolver
	return graphQLModel.VPLProcedure{
		ID:        vplProcedure.ID,
		Name:      vplProcedure.Name,
		Data:      vplProcedure.Data,
		Programs:  []graphQLModel.VPLProgram{},     // Empty slice, will be populated by resolver
	}
}
