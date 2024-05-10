package graphql

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/api/graphql/model"
)

var SDInstanceChannel = make(chan *model.SDInstance)
var KPIFulfillmentCheckResultChannel = make(chan *model.KPIFulfillmentCheckResult)
