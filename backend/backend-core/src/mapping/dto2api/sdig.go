package dto2api

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/api/graphql/model"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/types"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func SDInstanceGroupDTOToSDInstanceGroup(sdInstanceGroupDTO types.SDInstanceGroupDTO) *model.SDInstanceGroup {
	return &model.SDInstanceGroup{
		ID:             util.UINT32ToString(sdInstanceGroupDTO.ID.GetPayload()),
		UserIdentifier: sdInstanceGroupDTO.UserIdentifier,
		SdInstanceIDs:  util.Map(sdInstanceGroupDTO.SDInstanceIDs, util.UINT32ToString),
	}
}
