package gql2dll

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

func ToDLLModelVPLProgram(vplProgram graphQLModel.VPLProgram) dllModel.VPLProgram {
	return dllModel.VPLProgram{
		ID:   vplProgram.ID,
		Name: vplProgram.Name,
		Data: vplProgram.Data,
		SDParameterSnapshots: sharedUtils.Map(vplProgram.SdParameterSnapshots, func(snapshot graphQLModel.SDParameterSnapshot) dllModel.SDParameterSnapshot {
			return dllModel.SDParameterSnapshot{
				SDInstance:  snapshot.InstanceID,
				SDParameter: snapshot.ParameterID,
			}
		}),
	}
}
