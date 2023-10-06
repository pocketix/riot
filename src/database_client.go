package main

import (
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

const (
	dsn = "host=host.docker.internal user=admin password=password dbname=postgres-db port=5432"
)

type RelationalDatabaseClient interface {
	ConnectToDatabase() error
	InitializeDatabase() error
	ObtainNumericKeyPerformanceIndicatorDefinitionsForCertainDeviceType(deviceType string) ([]NumericKeyPerformanceIndicatorDefinition, error)
}

type relationalDatabaseClientImpl struct {
	db *gorm.DB
}

// NewRelationalDatabaseClient is a constructor-like function that returns an instance of RelationalDatabaseClient
func NewRelationalDatabaseClient() RelationalDatabaseClient {
	return &relationalDatabaseClientImpl{db: nil}
}

func (r *relationalDatabaseClientImpl) ConnectToDatabase() error {

	var err error
	r.db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Println("Error connecting to database:", err)
		return err
	}

	log.Println("Successfully connected to the database.")
	return nil
}

func (r *relationalDatabaseClientImpl) InitializeDatabase() error {

	err := r.db.AutoMigrate(&NumericKeyPerformanceIndicatorDefinition{})
	if err != nil {
		log.Println("Error on DB.AutoMigrate(): ", err)
		return err
	}

	var count int64
	r.db.Model(&NumericKeyPerformanceIndicatorDefinition{}).Count(&count)
	if count > 0 {
		log.Printf("The '%s' table is not empty: skipping data insertion.\n", NumericKeyPerformanceIndicatorDefinitionsTableName)
		return nil
	}

	dataToInsertIntoNumericKeyPerformanceIndicatorDefinitionsTable := []NumericKeyPerformanceIndicatorDefinition{
		{
			HumanReadableDescription: "The relay NO. 0 temperature of devices belonging to device type shelly1pro must be between 20°C and 24°C",
			DeviceType:               "shelly1pro",
			DeviceParameter:          "relay_0_temperature",
			ComparisonType:           "in_range",
			FirstNumericValue:        20.0,
			SecondNumericValue:       24.0,
		},
	}

	r.db.Create(&dataToInsertIntoNumericKeyPerformanceIndicatorDefinitionsTable)
	log.Printf("Inserted new records into the '%s' table.\n", NumericKeyPerformanceIndicatorDefinitionsTableName)

	return nil
}

func (r *relationalDatabaseClientImpl) ObtainNumericKeyPerformanceIndicatorDefinitionsForCertainDeviceType(targetDeviceType string) ([]NumericKeyPerformanceIndicatorDefinition, error) {

	var numericKeyPerformanceIndicatorDefinitions []NumericKeyPerformanceIndicatorDefinition
	result := r.db.Where("device_type = ?", targetDeviceType).Find(&numericKeyPerformanceIndicatorDefinitions)

	err := result.Error
	if err != nil {
		log.Println("Error loading data from database:", err)
		return nil, fmt.Errorf("error obtaining data from the '%s' table: %w", NumericKeyPerformanceIndicatorDefinitionsTableName, err)
	}

	return numericKeyPerformanceIndicatorDefinitions, nil
}
