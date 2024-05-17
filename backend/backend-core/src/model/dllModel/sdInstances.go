package dllModel

import "github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedUtils"

type SDInstance struct {
	ID              sharedUtils.Optional[uint32]
	UID             string
	ConfirmedByUser bool
	UserIdentifier  string
	SDType          SDType
}
