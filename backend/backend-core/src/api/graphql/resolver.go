package graphql

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db"
)

type Resolver struct {
	RdbClientInstance *db.RelationalDatabaseClient
}
