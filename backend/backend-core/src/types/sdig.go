package types

import "github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"

type SDInstanceGroupDTO struct {
	ID             util.Optional[uint32]
	UserIdentifier string
	SDInstanceIDs  []uint32
}
