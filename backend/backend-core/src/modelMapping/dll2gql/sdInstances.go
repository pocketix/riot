package dll2gql

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/graphQLModel"
)

func ToGraphQLModelSDInstance(sdInstance dllModel.SDInstance) graphQLModel.SDInstance {
	return graphQLModel.SDInstance{
		ID:              sdInstance.ID.GetPayload(),
		UID:             sdInstance.UID,
		ConfirmedByUser: sdInstance.ConfirmedByUser,
		UserIdentifier:  sdInstance.UserIdentifier,
		Type:            ToGraphQLModelSDType(sdInstance.SDType),
	}
}
