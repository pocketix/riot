package api2dto

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/api/graphql/model"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/types"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func SDInstanceGroupInputToSDInstanceGroupDTO(input model.SDInstanceGroupInput) util.Result[types.SDInstanceGroupDTO] {
	sdInstanceIDs, err := util.EMap[string, uint32](input.SdInstanceIDs, func(stringID string) (uint32, error) {
		return util.UINT32FromString(stringID).Unwrap()
	})
	if err != nil {
		return util.NewFailureResult[types.SDInstanceGroupDTO](err)
	}
	return util.NewSuccessResult(types.SDInstanceGroupDTO{
		ID:             util.NewEmptyOptional[uint32](),
		UserIdentifier: input.UserIdentifier,
		SDInstanceIDs:  sdInstanceIDs,
	})
}
