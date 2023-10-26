package main

import (
	"bp-bures-SfPDfSD/src/persistence/relational-database"
	"log"
	"testing"
)

func obtainCertainKPIDefinitionsFromRelationalDatabase(relationalDatabaseClient relational_database.RelationalDatabaseClient) error {

	deviceType := "shelly1pro"
	_, err := relationalDatabaseClient.ObtainKPIDefinitionsForTheGivenDeviceType(deviceType)
	if err != nil {
		log.Printf("Could not load the KPI definitions for the device type '%s' from the relational-database: cannot proceed with benchmarking...\n", deviceType)
		return err
	}

	return nil
}

func BenchmarkObtainCertainKPIDefinitions(b *testing.B) {

	relationalDatabaseClient, err := relational_database.GetRelationalDatabaseClient()
	if err != nil {
		b.Fatal(err)
		return
	}

	b.Run("FromRelationalDatabase", func(b *testing.B) {
		b.ResetTimer()
		for i := 0; i < b.N; i++ {
			err := obtainCertainKPIDefinitionsFromRelationalDatabase(relationalDatabaseClient)
			if err != nil {
				b.Fatal(err)
				return
			}
		}
	})
}
