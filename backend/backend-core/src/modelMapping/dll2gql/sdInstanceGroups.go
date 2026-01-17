package dll2gql

import (
	"github.com/pocketix/riot/backend-core/src/model/dllModel"
	"github.com/pocketix/riot/backend-core/src/model/graphQLModel"
)

func ToGraphQLModelSDInstanceGroup(sdInstanceGroup dllModel.SDInstanceGroup) graphQLModel.SDInstanceGroup {
	return graphQLModel.SDInstanceGroup{
		ID:             sdInstanceGroup.ID.GetPayload(),
		UserIdentifier: sdInstanceGroup.UserIdentifier,
		SdInstanceIDs:  sdInstanceGroup.SDInstanceIDs,
	}
}
