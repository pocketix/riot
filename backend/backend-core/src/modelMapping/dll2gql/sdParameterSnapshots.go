package dll2gql

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
	"time"
)

func ToGraphQLModelSdParameterSnapshot(parameterSnapshot dllModel.SDParameterSnapshot) graphQLModel.SDParameterSnapshot {
	return graphQLModel.SDParameterSnapshot{
		InstanceUID:         parameterSnapshot.SDInstance,
		ParameterDenotation: parameterSnapshot.SDParameter,
		String:              parameterSnapshot.String,
		Number:              parameterSnapshot.Number,
		Boolean:             parameterSnapshot.Boolean,
		UpdatedAt:           parameterSnapshot.UpdatedAt.Format(time.RFC3339),
	}
}
