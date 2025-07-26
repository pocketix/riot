package gql2dll

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
)

func ToDLLModelSdInstanceFilter(filter *graphQLModel.SDInstanceQueryFilterInput) *dllModel.SDInstanceFilter {
	if filter == nil {
		return nil
	}
	return &dllModel.SDInstanceFilter{
		IDs:             filter.Ids,
		SDTypeIDs:       filter.SdTypeIDs,
		ConfirmedByUser: filter.ConfirmedByUser,
	}
}
