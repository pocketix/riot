package api2dto

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/types"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func SDInstanceGroupInputToSDInstanceGroupDTO(input graphQLModel.SDInstanceGroupInput) util.Result[types.SDInstanceGroupDTO] {
	return util.NewSuccessResult(types.SDInstanceGroupDTO{
		ID:             util.NewEmptyOptional[uint32](),
		UserIdentifier: input.UserIdentifier,
		SDInstanceIDs:  input.SdInstanceIDs,
	})
}
