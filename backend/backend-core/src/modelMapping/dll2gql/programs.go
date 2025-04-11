package dll2gql

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

func ToGraphQLModelVPLProgram(vplProgram dllModel.VPLProgram) graphQLModel.VPLProgram {
	return graphQLModel.VPLProgram{
		ID:   vplProgram.ID,
		Name: vplProgram.Name,
		Data: vplProgram.Data,
		SdParameterSnapshots: sharedUtils.Map(vplProgram.SDParameterSnapshots, func(snapshot dllModel.SDParameterSnapshot) graphQLModel.SDParameterSnapshot {
			return graphQLModel.SDParameterSnapshot{
				InstanceID:  snapshot.SDInstance,
				ParameterID: snapshot.SDParameter,
			}
		}),
	}
}
