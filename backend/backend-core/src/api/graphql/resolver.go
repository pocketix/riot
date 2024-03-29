package graphql

import "bp-bures-SfPDfSD/src/persistence/rdb"

type Resolver struct {
	rdbClient rdb.RelationalDatabaseClient
}
