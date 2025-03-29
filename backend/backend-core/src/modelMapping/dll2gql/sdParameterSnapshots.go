package dll2gql

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
	"time"
)

func ToGraphQLModelSdParameterSnapshot(parameterSnapshot dllModel.SDParameterSnapshot) graphQLModel.SDParameterSnapshot {
	return graphQLModel.SDParameterSnapshot{
		InstanceID:  parameterSnapshot.SDInstance,
		ParameterID: parameterSnapshot.SDParameter,
		String:      parameterSnapshot.String.ToPointer(),
		Number:      parameterSnapshot.Number.ToPointer(),
		Boolean:     parameterSnapshot.Boolean.ToPointer(),
		UpdatedAt:   parameterSnapshot.UpdatedAt.Format(time.RFC3339),
	}
}
