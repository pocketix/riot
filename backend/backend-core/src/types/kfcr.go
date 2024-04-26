package types

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/kpi"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

type KPIFulfillmentCheckResultDTO struct {
	ID            util.Optional[uint32]
	KPIDefinition kpi.DefinitionDTO
	SDInstance    SDInstanceDTO
	Fulfilled     bool
}
