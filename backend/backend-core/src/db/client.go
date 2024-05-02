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
	dsn = "host=postgres user=admin password=password dbname=postgres-db port=5432"
)

type RelationalDatabaseClient interface {
	ConnectToDatabase() error
	InitializeDatabase() error
	PersistKPIDefinition(kpiDefinitionDTO kpi.DefinitionDTO) cUtil.Result[uint32] // TODO: Is ID enough?
	LoadKPIDefinition(id uint32) cUtil.Result[kpi.DefinitionDTO]
	LoadKPIDefinitions() cUtil.Result[[]kpi.DefinitionDTO]
	DeleteKPIDefinition(id uint32) error
	PersistSDType(sdTypeDTO types.SDTypeDTO) cUtil.Result[types.SDTypeDTO]
	LoadSDType(id uint32) cUtil.Result[types.SDTypeDTO]
	LoadSDTypeBasedOnDenotation(denotation string) cUtil.Result[types.SDTypeDTO]
	LoadSDTypes() cUtil.Result[[]types.SDTypeDTO]
	DeleteSDType(id uint32) error
	PersistSDInstance(sdInstanceDTO types.SDInstanceDTO) cUtil.Result[uint32] // TODO: Is ID enough?
	LoadSDInstance(id uint32) cUtil.Result[types.SDInstanceDTO]
	DoesSDInstanceExist(uid string) cUtil.Result[bool]
	LoadSDInstances() cUtil.Result[[]types.SDInstanceDTO]
	DeleteSDInstance(id uint32) error
	PersistKPIFulFulfillmentCheckResult(kpiFulfillmentCheckResultDTO types.KPIFulfillmentCheckResultDTO) cUtil.Result[uint32] // TODO: Is ID enough?
	LoadKPIFulFulfillmentCheckResult(id uint32) cUtil.Result[types.KPIFulfillmentCheckResultDTO]
	LoadKPIFulFulfillmentCheckResults() cUtil.Result[[]types.KPIFulfillmentCheckResultDTO]
	DeleteKPIFulFulfillmentCheckResult(id uint32) error
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
		&schema.KPIFulfillmentCheckResultEntity{},
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
	var kpiDefinitionEntities []schema.KPIDefinitionEntity
	if err := r.db.Find(&kpiDefinitionEntities).Error; err != nil {
		return cUtil.NewFailureResult[[]kpi.DefinitionDTO](err)
	}
	var kpiNodeEntities []schema.KPINodeEntity
	if err := r.db.Find(&kpiNodeEntities).Error; err != nil {
		return cUtil.NewFailureResult[[]kpi.DefinitionDTO](err)
	}
	var logicalOperationKPINodeEntities []schema.LogicalOperationKPINodeEntity
	if err := r.db.Find(&logicalOperationKPINodeEntities).Error; err != nil {
		return cUtil.NewFailureResult[[]kpi.DefinitionDTO](err)
	}
	var atomKPINodeEntities []schema.AtomKPINodeEntity
	if err := r.db.Find(&atomKPINodeEntities).Error; err != nil {
		return cUtil.NewFailureResult[[]kpi.DefinitionDTO](err)
	}
	var kpiDefinitionDTOs []kpi.DefinitionDTO
	for _, kpiDefinitionEntity := range kpiDefinitionEntities {
		kpiDefinitionDTO := db2dto.ReconstructKPIDefinitionDTO(kpiDefinitionEntity, kpiNodeEntities, logicalOperationKPINodeEntities, atomKPINodeEntities)
		kpiDefinitionDTOs = append(kpiDefinitionDTOs, kpiDefinitionDTO)
	}
	return cUtil.NewSuccessResult[[]kpi.DefinitionDTO](kpiDefinitionDTOs)
}

func (r *relationalDatabaseClientImpl) DeleteKPIDefinition(id uint32) error {
	// TODO: Implement
	return errors.New("[rdb client] not implemented")
}

func (r *relationalDatabaseClientImpl) PersistSDType(sdTypeDTO types.SDTypeDTO) cUtil.Result[types.SDTypeDTO] {
	sdTypeEntity := dto2db.SDTypeDTOToSDTypeEntity(sdTypeDTO)
	err := r.db.Save(&sdTypeEntity).Error
	if err != nil {
		return cUtil.NewFailureResult[types.SDTypeDTO](err)
	}
	return cUtil.NewSuccessResult[types.SDTypeDTO](db2dto.SDTypeEntityToSDTypeDTO(sdTypeEntity))
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
	tx := r.db.Begin()
	var sdInstanceEntities []schema.SDInstanceEntity
	if err := tx.Where("sd_type_id = ?", id).Find(&sdInstanceEntities).Error; err != nil {
		tx.Rollback()
		return err
	}
	for _, sdInstanceEntity := range sdInstanceEntities {
		sdInstanceID := sdInstanceEntity.ID
		if err := tx.Where("sd_instance_id = ?", sdInstanceID).Delete(new(schema.KPIFulfillmentCheckResultEntity)).Error; err != nil {
			tx.Rollback()
			return err
		}
		if err := tx.Delete(new(schema.SDInstanceEntity), sdInstanceID).Error; err != nil {
			tx.Rollback()
			return err
		}
	}
	if err := tx.Where("sd_type_id = ?", id).Delete(new(schema.SDParameterEntity)).Error; err != nil {
		tx.Rollback()
		return err
	}
	if err := tx.Delete(new(schema.SDTypeEntity), id).Error; err != nil {
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

func (r *relationalDatabaseClientImpl) PersistKPIFulFulfillmentCheckResult(kpiFulfillmentCheckResultDTO types.KPIFulfillmentCheckResultDTO) cUtil.Result[uint32] {
	kpiFulfillmentCheckEntity := dto2db.KPIFulfillmentCheckResultDTOToKPIFulfillmentCheckResultEntity(kpiFulfillmentCheckResultDTO)
	if err := PersistEntityIntoDB(r, &kpiFulfillmentCheckEntity); err != nil {
		return cUtil.NewFailureResult[uint32](err)
	}
	return cUtil.NewSuccessResult[uint32](kpiFulfillmentCheckEntity.ID)
}

func (r *relationalDatabaseClientImpl) LoadKPIFulFulfillmentCheckResult(id uint32) cUtil.Result[types.KPIFulfillmentCheckResultDTO] {
	// TODO: Implement
	return cUtil.NewFailureResult[types.KPIFulfillmentCheckResultDTO](errors.New("[rdb client] not implemented"))
}

func (r *relationalDatabaseClientImpl) LoadKPIFulFulfillmentCheckResults() cUtil.Result[[]types.KPIFulfillmentCheckResultDTO] {
	kpiFulFulfillmentCheckResultEntitiesLoadResult := LoadEntitiesFromDB[schema.KPIFulfillmentCheckResultEntity](r, "SDInstance.SDType.Parameters", "KPIDefinition")
	if kpiFulFulfillmentCheckResultEntitiesLoadResult.IsFailure() {
		return cUtil.NewFailureResult[[]types.KPIFulfillmentCheckResultDTO](kpiFulFulfillmentCheckResultEntitiesLoadResult.GetError())
	}
	kpiFulFulfillmentCheckResultEntities := kpiFulFulfillmentCheckResultEntitiesLoadResult.GetPayload()
	kpiNodeEntitiesLoadResult := LoadEntitiesFromDB[schema.KPINodeEntity](r)
	if kpiNodeEntitiesLoadResult.IsFailure() {
		return cUtil.NewFailureResult[[]types.KPIFulfillmentCheckResultDTO](kpiNodeEntitiesLoadResult.GetError())
	}
	kpiNodeEntities := kpiNodeEntitiesLoadResult.GetPayload()
	logicalOperationKPINodeEntitiesLoadResult := LoadEntitiesFromDB[schema.LogicalOperationKPINodeEntity](r)
	if logicalOperationKPINodeEntitiesLoadResult.IsFailure() {
		return cUtil.NewFailureResult[[]types.KPIFulfillmentCheckResultDTO](logicalOperationKPINodeEntitiesLoadResult.GetError())
	}
	logicalOperationKPINodeEntities := logicalOperationKPINodeEntitiesLoadResult.GetPayload()
	atomKPINodeEntitiesLoadResult := LoadEntitiesFromDB[schema.AtomKPINodeEntity](r)
	if atomKPINodeEntitiesLoadResult.IsFailure() {
		return cUtil.NewFailureResult[[]types.KPIFulfillmentCheckResultDTO](atomKPINodeEntitiesLoadResult.GetError())
	}
	atomKPINodeEntities := atomKPINodeEntitiesLoadResult.GetPayload()
	return cUtil.NewSuccessResult[[]types.KPIFulfillmentCheckResultDTO](cUtil.Map(kpiFulFulfillmentCheckResultEntities, func(kpiFulfillmentCheckResultEntity schema.KPIFulfillmentCheckResultEntity) types.KPIFulfillmentCheckResultDTO {
		return db2dto.KPIFulfillmentCheckResultEntityToKPIFulfillmentCheckResultDTO(kpiFulfillmentCheckResultEntity, kpiNodeEntities, logicalOperationKPINodeEntities, atomKPINodeEntities)
	}))
}

func (r *relationalDatabaseClientImpl) DeleteKPIFulFulfillmentCheckResult(id uint32) error {
	// TODO: Implement
	return errors.New("[rdb client] not implemented")
}
