package dllModel

import "github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedUtils"

type SDInstanceGroup struct {
	ID             sharedUtils.Optional[uint32]
	UserIdentifier string
	SDInstanceIDs  []uint32
}
