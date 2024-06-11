package dllModel

import "github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"

type SDInstanceGroup struct {
	ID             sharedUtils.Optional[uint32]
	UserIdentifier string
	SDInstanceIDs  []uint32
}
