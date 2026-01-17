package gql2dll

import (
	"github.com/pocketix/riot/backend-core/src/model/dllModel"
	"github.com/pocketix/riot/backend-core/src/model/graphQLModel"
	"github.com/pocketix/riot/commons/src/sharedUtils"
)

func ToDLLModelSDInstanceGroup(sdInstanceGroupInput graphQLModel.SDInstanceGroupInput) dllModel.SDInstanceGroup {
	return dllModel.SDInstanceGroup{
		ID:             sharedUtils.NewEmptyOptional[uint32](),
		UserIdentifier: sdInstanceGroupInput.UserIdentifier,
		SDInstanceIDs:  sdInstanceGroupInput.SdInstanceIDs,
	}
}
