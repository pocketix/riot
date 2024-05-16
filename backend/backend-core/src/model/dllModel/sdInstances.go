package dllModel

import "github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"

type SDInstance struct {
	ID              util.Optional[uint32]
	UID             string
	ConfirmedByUser bool
	UserIdentifier  string
	SDType          SDType
}
