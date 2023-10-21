package main

import (
	"log"
	"testing"
)

func setupRelationalDatabaseClient() (RelationalDatabaseClient, error) {

	var err error

	relationalDatabaseClient = NewRelationalDatabaseClient()
	err = relationalDatabaseClient.ConnectToDatabase()
	if err != nil {
		log.Println("Cannot connect to the relational database: terminating the benchmarking...")
		return nil, err
	}
	err = relationalDatabaseClient.InitializeDatabase()
	if err != nil {
		log.Println("Cannot initialize the relational database: terminating the benchmarking...")
		return nil, err
	}

	return relationalDatabaseClient, nil
}

func obtainCertainKPIDefinitionsFromRelationalDatabase(relationalDatabaseClient RelationalDatabaseClient) error {

	deviceType := "shelly1pro"
	_, err := relationalDatabaseClient.ObtainRootKPIDefinitionsForTheGivenDeviceType(deviceType)
	if err != nil {
		log.Printf("Could not load the KPI definitions for the device type '%s' from the database: cannot proceed with benchmarking...\n", deviceType)
		return err
	}

	return nil
}

func BenchmarkObtainCertainKPIDefinitions(b *testing.B) {

	relationalDatabaseClient, err := setupRelationalDatabaseClient()
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
