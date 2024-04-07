package db

import (
	"errors"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/schema"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/mapping/db2dto"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/mapping/dto2db"
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
	PersistKPIDefinition(kpiDefinitionDTO kpi.DefinitionDTO) cUtil.Result[uint32]
	LoadKPIDefinition(id uint32) cUtil.Result[kpi.DefinitionDTO]
	LoadKPIDefinitions() cUtil.Result[[]kpi.DefinitionDTO]
	DeleteKPIDefinition(id uint32) error
	PersistSDType(sdTypeDTO types.SDTypeDTO) cUtil.Result[uint32]
	LoadSDType(id uint32) cUtil.Result[types.SDTypeDTO]
	LoadSDTypeBasedOnDenotation(denotation string) cUtil.Result[types.SDTypeDTO]
	LoadSDTypes() cUtil.Result[[]types.SDTypeDTO]
	DeleteSDType(id uint32) error
	PersistSDInstance(sdInstanceDTO types.SDInstanceDTO) cUtil.Result[uint32]
	LoadSDInstance(id uint32) cUtil.Result[types.SDInstanceDTO]
	DoesSDInstanceExist(uid string) cUtil.Result[bool]
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

func (r *relationalDatabaseClientImpl) PersistKPIDefinition(kpiDefinitionDTO kpi.DefinitionDTO) cUtil.Result[uint32] {
	kpiNodeEntity, kpiNodeEntities, logicalOperationNodeEntities, atomNodeEntities := dto2db.TransformKPIDefinitionTree(kpiDefinitionDTO.RootNode, nil, []*schema.KPINodeEntity{}, []schema.LogicalOperationKPINodeEntity{}, []schema.AtomKPINodeEntity{})
	kpiDefinitionEntity := schema.KPIDefinitionEntity{
		SDTypeSpecification: kpiDefinitionDTO.SDTypeSpecification,
		UserIdentifier:      kpiDefinitionDTO.UserIdentifier,
		RootNode:            kpiNodeEntity,
	}
	tx := r.db.Begin()
	for index, entity := range kpiNodeEntities {
		if err := tx.Create(&entity).Error; err != nil {
			tx.Rollback()
			return cUtil.NewFailureResult[uint32](err)
		}
		kpiNodeEntities[index] = entity
	}
	if err := tx.Create(&kpiDefinitionEntity).Error; err != nil {
		tx.Rollback()
		return cUtil.NewFailureResult[uint32](err)
	}
	for index, entity := range logicalOperationNodeEntities {
		if err := tx.Create(&entity).Error; err != nil {
			tx.Rollback()
			return cUtil.NewFailureResult[uint32](err)
		}
		logicalOperationNodeEntities[index] = entity
	}
	for index, entity := range atomNodeEntities {
		if err := tx.Create(&entity).Error; err != nil {
			tx.Rollback()
			return cUtil.NewFailureResult[uint32](err)
		}
		atomNodeEntities[index] = entity
	}
	tx.Commit()
	return cUtil.NewSuccessResult[uint32](kpiDefinitionEntity.ID)
}

func (r *relationalDatabaseClientImpl) LoadKPIDefinition(id uint32) cUtil.Result[kpi.DefinitionDTO] {
	// TODO: Implement
	return cUtil.NewFailureResult[kpi.DefinitionDTO](errors.New("[rdb client] not implemented"))
}

func (r *relationalDatabaseClientImpl) LoadKPIDefinitions() cUtil.Result[[]kpi.DefinitionDTO] {
	// TODO: Implement
	return cUtil.NewFailureResult[[]kpi.DefinitionDTO](errors.New("[rdb client] not implemented"))
}

func (r *relationalDatabaseClientImpl) DeleteKPIDefinition(id uint32) error {
	// TODO: Implement
	return errors.New("[rdb client] not implemented")
}

func (r *relationalDatabaseClientImpl) PersistSDType(sdTypeDTO types.SDTypeDTO) cUtil.Result[uint32] {
	sdTypeEntity := dto2db.SDTypeDTOToSDTypeEntity(sdTypeDTO)
	err := r.db.Save(&sdTypeEntity).Error
	if err != nil {
		return cUtil.NewFailureResult[uint32](err)
	}
	return cUtil.NewSuccessResult[uint32](sdTypeEntity.ID)
}

func (r *relationalDatabaseClientImpl) LoadSDType(id uint32) cUtil.Result[types.SDTypeDTO] {
	var sdTypeEntity schema.SDTypeEntity
	err := r.db.Preload("Parameters").Where("id = ?", id).First(&sdTypeEntity).Error
	if err != nil {
		return cUtil.NewFailureResult[types.SDTypeDTO](err)
	}
	return cUtil.NewSuccessResult[types.SDTypeDTO](db2dto.SDTypeEntityToSDTypeDTO(sdTypeEntity))
}

func (r *relationalDatabaseClientImpl) LoadSDTypeBasedOnDenotation(denotation string) cUtil.Result[types.SDTypeDTO] {
	var sdTypeEntity schema.SDTypeEntity
	err := r.db.Preload("Parameters").Where("denotation = ?", denotation).First(&sdTypeEntity).Error
	if err != nil {
		return cUtil.NewFailureResult[types.SDTypeDTO](err)
	}
	return cUtil.NewSuccessResult[types.SDTypeDTO](db2dto.SDTypeEntityToSDTypeDTO(sdTypeEntity))
}

func (r *relationalDatabaseClientImpl) LoadSDTypes() cUtil.Result[[]types.SDTypeDTO] {
	var sdTypeEntities []schema.SDTypeEntity
	err := r.db.Preload("Parameters").Find(&sdTypeEntities).Error
	if err != nil {
		return cUtil.NewFailureResult[[]types.SDTypeDTO](err)
	}
	return cUtil.NewSuccessResult[[]types.SDTypeDTO](cUtil.Map(sdTypeEntities, db2dto.SDTypeEntityToSDTypeDTO))
}

func (r *relationalDatabaseClientImpl) DeleteSDType(id uint32) error {
	var err error
	var sdInstanceEntities []schema.SDInstanceEntity
	err = r.db.Find(&sdInstanceEntities).Error
	if err != nil {
		return err
	}
	if cUtil.Any(sdInstanceEntities, func(sdInstanceEntity schema.SDInstanceEntity) bool { return sdInstanceEntity.SDTypeID == id }) {
		return errors.New("cannot delete SD type with existing SD instances tied to it")
	}
	tx := r.db.Begin()
	err = tx.Where("sd_type_id = ?", id).Delete(&schema.SDParameterEntity{}).Error
	if err != nil {
		tx.Rollback()
		return err
	}
	err = tx.Delete(&schema.SDTypeEntity{}, id).Error
	if err != nil {
		tx.Rollback()
		return err
	}
	tx.Commit()
	return nil
}

func (r *relationalDatabaseClientImpl) PersistSDInstance(sdInstanceDTO types.SDInstanceDTO) cUtil.Result[uint32] {
	sdInstanceEntity := dto2db.SDInstanceDTOToSDInstanceEntity(sdInstanceDTO)
	err := r.db.Save(&sdInstanceEntity).Error
	if err != nil {
		return cUtil.NewFailureResult[uint32](err)
	}
	return cUtil.NewSuccessResult[uint32](sdInstanceEntity.ID)
}

func (r *relationalDatabaseClientImpl) LoadSDInstance(id uint32) cUtil.Result[types.SDInstanceDTO] {
	var sdInstanceEntity schema.SDInstanceEntity
	err := r.db.Where("id = ?", id).First(&sdInstanceEntity).Error
	if err != nil {
		return cUtil.NewFailureResult[types.SDInstanceDTO](err)
	}
	getSDTypeEntityByIdMapResult := r.getSDTypeEntityByIdMap()
	if getSDTypeEntityByIdMapResult.IsFailure() {
		return cUtil.NewFailureResult[types.SDInstanceDTO](getSDTypeEntityByIdMapResult.GetError())
	}
	sdInstanceEntity.SDType = getSDTypeEntityByIdMapResult.GetPayload()[sdInstanceEntity.SDTypeID]
	return cUtil.NewSuccessResult[types.SDInstanceDTO](db2dto.SDInstanceEntityToSDInstanceDTO(sdInstanceEntity))
}

func (r *relationalDatabaseClientImpl) DoesSDInstanceExist(uid string) cUtil.Result[bool] {
	var count int64
	err := r.db.Model(&schema.SDInstanceEntity{}).Where("uid = ?", uid).Count(&count).Error
	if err != nil {
		return cUtil.NewFailureResult[bool](err)
	}
	return cUtil.NewSuccessResult[bool](count > 0)
}

func (r *relationalDatabaseClientImpl) LoadSDInstances() cUtil.Result[[]types.SDInstanceDTO] {
	var sdInstanceEntities []schema.SDInstanceEntity
	err := r.db.Find(&sdInstanceEntities).Error
	if err != nil {
		return cUtil.NewFailureResult[[]types.SDInstanceDTO](err)
	}
	getSDTypeEntityByIdMapResult := r.getSDTypeEntityByIdMap()
	if getSDTypeEntityByIdMapResult.IsFailure() {
		return cUtil.NewFailureResult[[]types.SDInstanceDTO](getSDTypeEntityByIdMapResult.GetError())
	}
	sdTypeEntityByIdMap := getSDTypeEntityByIdMapResult.GetPayload()
	for index, sdInstanceEntity := range sdInstanceEntities {
		sdInstanceEntity.SDType = sdTypeEntityByIdMap[sdInstanceEntity.SDTypeID]
		sdInstanceEntities[index] = sdInstanceEntity
	}
	return cUtil.NewSuccessResult[[]types.SDInstanceDTO](cUtil.Map(sdInstanceEntities, db2dto.SDInstanceEntityToSDInstanceDTO))
}

func (r *relationalDatabaseClientImpl) DeleteSDInstance(id uint32) error {
	// TODO: Implement
	return errors.New("[rdb client] not implemented")
}
