package dto2api

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/types"
)

func SDInstanceGroupDTOToSDInstanceGroup(sdInstanceGroupDTO types.SDInstanceGroupDTO) graphQLModel.SDInstanceGroup {
	return graphQLModel.SDInstanceGroup{
		ID:             sdInstanceGroupDTO.ID.GetPayload(),
		UserIdentifier: sdInstanceGroupDTO.UserIdentifier,
		SdInstanceIDs:  sdInstanceGroupDTO.SDInstanceIDs,
	}
}
