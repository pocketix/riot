package gql2dll

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

func ToDLLModelSDInstanceGroup(sdInstanceGroupInput graphQLModel.SDInstanceGroupInput) dllModel.SDInstanceGroup {
	return dllModel.SDInstanceGroup{
		ID:             sharedUtils.NewEmptyOptional[uint32](),
		UserIdentifier: sdInstanceGroupInput.UserIdentifier,
		SDInstanceIDs:  sdInstanceGroupInput.SdInstanceIDs,
	}
}
