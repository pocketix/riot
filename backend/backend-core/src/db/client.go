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
	PersistKPIDefinition(kpiDefinition kpi.DefinitionDTO) cUtil.Result[uint32]
	LoadKPIDefinition(id uint32) cUtil.Result[kpi.DefinitionDTO]
	LoadKPIDefinitions() cUtil.Result[[]kpi.DefinitionDTO]
	DeleteKPIDefinition(id uint32) error
	PersistSDType(sdType types.SDTypeDTO) cUtil.Result[uint32]
	LoadSDType(id uint32) cUtil.Result[types.SDTypeDTO]
	LoadSDTypes() cUtil.Result[[]types.SDTypeDTO]
	DeleteSDType(id uint32) error
	PersistSDInstance(sdInstance types.SDInstanceDTO) cUtil.Result[uint32]
	LoadSDInstance(id uint32) cUtil.Result[types.SDInstanceDTO]
	LoadSDInstances() cUtil.Result[[]types.SDInstanceDTO]
	DeleteSDInstance(id uint32) error
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

func (r *relationalDatabaseClientImpl) PersistKPIDefinition(kpiDefinition kpi.DefinitionDTO) cUtil.Result[uint32] {
	// TODO: Implement
	return cUtil.NewFailureResult[uint32](nil)
}

func (r *relationalDatabaseClientImpl) LoadKPIDefinition(id uint32) cUtil.Result[kpi.DefinitionDTO] {
	// TODO: Implement
	return cUtil.NewFailureResult[kpi.DefinitionDTO](nil)
}

func (r *relationalDatabaseClientImpl) LoadKPIDefinitions() cUtil.Result[[]kpi.DefinitionDTO] {
	// TODO: Implement
	return cUtil.NewFailureResult[[]kpi.DefinitionDTO](nil)
}

func (r *relationalDatabaseClientImpl) DeleteKPIDefinition(id uint32) error {
	// TODO: Implement
	return nil
}

func (r *relationalDatabaseClientImpl) PersistSDType(sdType types.SDTypeDTO) cUtil.Result[uint32] {
	// TODO: Implement
	return cUtil.NewFailureResult[uint32](nil)
}

func (r *relationalDatabaseClientImpl) LoadSDType(id uint32) cUtil.Result[types.SDTypeDTO] {
	// TODO: Implement
	return cUtil.NewFailureResult[types.SDTypeDTO](nil)
}

func (r *relationalDatabaseClientImpl) LoadSDTypes() cUtil.Result[[]types.SDTypeDTO] {
	// TODO: Implement
	return cUtil.NewFailureResult[[]types.SDTypeDTO](nil)
}

func (r *relationalDatabaseClientImpl) DeleteSDType(id uint32) error {
	// TODO: Implement
	return nil
}

func (r *relationalDatabaseClientImpl) PersistSDInstance(sdInstance types.SDInstanceDTO) cUtil.Result[uint32] {
	// TODO: Implement
	return cUtil.NewFailureResult[uint32](nil)
}

func (r *relationalDatabaseClientImpl) LoadSDInstance(id uint32) cUtil.Result[types.SDInstanceDTO] {
	// TODO: Implement
	return cUtil.NewFailureResult[types.SDInstanceDTO](nil)
}

func (r *relationalDatabaseClientImpl) LoadSDInstances() cUtil.Result[[]types.SDInstanceDTO] {
	// TODO: Implement
	return cUtil.NewFailureResult[[]types.SDInstanceDTO](nil)
}

func (r *relationalDatabaseClientImpl) DeleteSDInstance(id uint32) error {
	// TODO: Implement
	return nil
}
