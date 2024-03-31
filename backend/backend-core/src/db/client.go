package db

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/schema"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/types"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/kpi"
	cUtil "github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

const (
	dsn = "host=host.docker.internal user=admin password=password dbname=postgres-db port=5432"
)

type RelationalDatabaseClient interface {
	ConnectToDatabase() error
	InitializeDatabase() error
	PersistKPIDefinition(kpiDefinition kpi.DefinitionDTO) error
	LoadKPIDefinitions() ([]kpi.DefinitionDTO, error)
	PersistSDType(sdType types.SDTypeDTO) error
	LoadSDTypes() ([]types.SDTypeDTO, error)
	PersistSDInstance(sdInstance types.SDInstanceDTO) error
	LoadSDInstances() ([]types.SDInstanceDTO, error)
}

type relationalDatabaseClientImpl struct {
	db *gorm.DB
}

var rdbClientInstance RelationalDatabaseClient

func GetRelationalDatabaseClientInstance() *RelationalDatabaseClient {
	return &rdbClientInstance
}

func SetupRelationalDatabaseClient() {
	rdbClientInstance = &relationalDatabaseClientImpl{db: nil}
	cUtil.TerminateOnError(rdbClientInstance.ConnectToDatabase(), "Failed to setup the relational database client [connect]")
	cUtil.TerminateOnError(rdbClientInstance.InitializeDatabase(), "Failed to setup the relational database client [initialize]")
}

func (r *relationalDatabaseClientImpl) ConnectToDatabase() error {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return err
	}
	r.db = db
	r.db = r.db.Session(&gorm.Session{Logger: logger.Default.LogMode(logger.Silent)})
	return nil
}

func (r *relationalDatabaseClientImpl) InitializeDatabase() error {
	return r.db.AutoMigrate(
		&schema.KPIDefinitionEntity{},
		&schema.KPINodeEntity{},
		&schema.LogicalOperationKPINodeEntity{},
		&schema.AtomKPINodeEntity{},
		&schema.SDTypeEntity{},
		&schema.SDParameterEntity{},
		&schema.SDInstanceEntity{},
	)
}

func (r *relationalDatabaseClientImpl) PersistKPIDefinition(kpiDefinition kpi.DefinitionDTO) error {
	// TODO: Implement
	return nil
}

func (r *relationalDatabaseClientImpl) LoadKPIDefinitions() ([]kpi.DefinitionDTO, error) {
	// TODO: Implement
	return nil, nil
}

func (r *relationalDatabaseClientImpl) PersistSDType(sdType types.SDTypeDTO) error {
	// TODO: Implement
	return nil
}

func (r *relationalDatabaseClientImpl) LoadSDTypes() ([]types.SDTypeDTO, error) {
	// TODO: Implement
	return nil, nil
}

func (r *relationalDatabaseClientImpl) PersistSDInstance(sdInstance types.SDInstanceDTO) error {
	// TODO: Implement
	return nil
}

func (r *relationalDatabaseClientImpl) LoadSDInstances() ([]types.SDInstanceDTO, error) {
	// TODO: Implement
	return nil, nil
}
