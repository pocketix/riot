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
		ReferencedValues: sharedUtils.Map(vplProgram.ReferencedValues, func(referencedValue dllModel.ReferencedValue) graphQLModel.VPLReferencedValue {
			return graphQLModel.VPLReferencedValue{
				ID:        referencedValue.ID,
				DeviceID:  referencedValue.DeviceID,
				Parameter: referencedValue.Parameter,
			}
		}),
	}
}
