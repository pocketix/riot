package graphql

import rdb "bp-bures-SfPDfSD/src/persistence/relational-database"

type Resolver struct {
	rdbClient rdb.RelationalDatabaseClient
}
