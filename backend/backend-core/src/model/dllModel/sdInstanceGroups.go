package dllModel

import "github.com/pocketix/riot/commons/src/sharedUtils"

type SDInstanceGroup struct {
	ID             sharedUtils.Optional[uint32]
	UserIdentifier string
	SDInstanceIDs  []uint32
}
