package db

import (
	"errors"
	"fmt"
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
	rdbClientInstance = new(relationalDatabaseClientImpl)
	cUtil.TerminateOnError(rdbClientInstance.ConnectToDatabase(), "Failed to setup the relational database client [connect]")
	cUtil.TerminateOnError(rdbClientInstance.InitializeDatabase(), "Failed to setup the relational database client [initialize]")
}

func (r *relationalDatabaseClientImpl) ConnectToDatabase() error {
	db, err := gorm.Open(postgres.Open(dsn), new(gorm.Config))
	if err != nil {
		return err
	}
	session := new(gorm.Session)
	session.Logger = logger.Default.LogMode(logger.Silent)
	r.db = db.Session(session)
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
		SDTypeID:       kpiDefinitionDTO.SDTypeID,
		UserIdentifier: kpiDefinitionDTO.UserIdentifier,
		RootNode:       kpiNodeEntity,
	}
	tx := r.db.Begin()
	for _, entity := range kpiNodeEntities {
		if err := PersistEntityIntoDB[schema.KPINodeEntity](tx, entity); err != nil {
			tx.Rollback()
			return cUtil.NewFailureResult[uint32](err)
		}
	}
	if err := PersistEntityIntoDB[schema.KPIDefinitionEntity](tx, &kpiDefinitionEntity); err != nil {
		tx.Rollback()
		return cUtil.NewFailureResult[uint32](err)
	}
	for _, entity := range logicalOperationNodeEntities {
		if err := PersistEntityIntoDB[schema.LogicalOperationKPINodeEntity](tx, &entity); err != nil {
			tx.Rollback()
			return cUtil.NewFailureResult[uint32](err)
		}
	}
	for _, entity := range atomNodeEntities {
		if err := PersistEntityIntoDB[schema.AtomKPINodeEntity](tx, &entity); err != nil {
			tx.Rollback()
			return cUtil.NewFailureResult[uint32](err)
		}
	}
	tx.Commit()
	return cUtil.NewSuccessResult[uint32](kpiDefinitionEntity.ID)
}

func (r *relationalDatabaseClientImpl) LoadKPIDefinition(id uint32) cUtil.Result[kpi.DefinitionDTO] {
	// TODO: Implement
	return cUtil.NewFailureResult[kpi.DefinitionDTO](errors.New("[rdb client] not implemented"))
}

func (r *relationalDatabaseClientImpl) LoadKPIDefinitions() cUtil.Result[[]kpi.DefinitionDTO] {
	kpiDefinitionEntitiesLoadResult := LoadEntitiesFromDB[schema.KPIDefinitionEntity](r.db, PreloadPath("SDType"))
	if kpiDefinitionEntitiesLoadResult.IsFailure() {
		err := fmt.Errorf("failed to load KPI definition entities from the database: %w", kpiDefinitionEntitiesLoadResult.GetError())
		return cUtil.NewFailureResult[[]kpi.DefinitionDTO](err)
	}
	kpiDefinitionEntities := kpiDefinitionEntitiesLoadResult.GetPayload()
	kpiNodeEntitiesLoadResult := LoadEntitiesFromDB[schema.KPINodeEntity](r.db)
	if kpiNodeEntitiesLoadResult.IsFailure() {
		err := fmt.Errorf("failed to load KPI node entities from the database: %w", kpiNodeEntitiesLoadResult.GetError())
		return cUtil.NewFailureResult[[]kpi.DefinitionDTO](err)
	}
	kpiNodeEntities := kpiNodeEntitiesLoadResult.GetPayload()
	logicalOperationKPINodeEntitiesLoadResult := LoadEntitiesFromDB[schema.LogicalOperationKPINodeEntity](r.db)
	if logicalOperationKPINodeEntitiesLoadResult.IsFailure() {
		err := fmt.Errorf("failed to load logical operation KPI node entities from the database: %w", logicalOperationKPINodeEntitiesLoadResult.GetError())
		return cUtil.NewFailureResult[[]kpi.DefinitionDTO](err)
	}
	logicalOperationKPINodeEntities := logicalOperationKPINodeEntitiesLoadResult.GetPayload()
	atomKPINodeEntitiesLoadResult := LoadEntitiesFromDB[schema.AtomKPINodeEntity](r.db, PreloadPath("SDParameter"))
	if atomKPINodeEntitiesLoadResult.IsFailure() {
		err := fmt.Errorf("failed to load atom KPI node entities from the database: %w", atomKPINodeEntitiesLoadResult.GetError())
		return cUtil.NewFailureResult[[]kpi.DefinitionDTO](err)
	}
	atomKPINodeEntities := atomKPINodeEntitiesLoadResult.GetPayload()
	kpiDefinitionDTOs := make([]kpi.DefinitionDTO, 0, len(kpiDefinitionEntities))
	cUtil.ForEach(kpiDefinitionEntities, func(kpiDefinitionEntity schema.KPIDefinitionEntity) {
		kpiDefinitionDTO := db2dto.ReconstructKPIDefinitionDTO(kpiDefinitionEntity, kpiNodeEntities, logicalOperationKPINodeEntities, atomKPINodeEntities)
		kpiDefinitionDTOs = append(kpiDefinitionDTOs, kpiDefinitionDTO)
	})
	return cUtil.NewSuccessResult[[]kpi.DefinitionDTO](kpiDefinitionDTOs)
}

func getIDsOfKPINodeEntitiesFormingTheKPIDefinition(g *gorm.DB, kpiDefinitionID uint32) cUtil.Result[[]uint32] {
	kpiDefinitionEntityLoadResult := LoadEntityFromDB[schema.KPIDefinitionEntity](g, WhereClause("id = ?", kpiDefinitionID))
	if kpiDefinitionEntityLoadResult.IsFailure() {
		err := fmt.Errorf("failed to load KPI definition entity with ID = %d from the database: %w", kpiDefinitionID, kpiDefinitionEntityLoadResult.GetError())
		return cUtil.NewFailureResult[[]uint32](err)
	}
	kpiDefinitionEntity := kpiDefinitionEntityLoadResult.GetPayload()
	kpiNodeEntitiesLoadResult := LoadEntitiesFromDB[schema.KPINodeEntity](g)
	if kpiNodeEntitiesLoadResult.IsFailure() {
		err := fmt.Errorf("failed to load KPI node entities from the database: %w", kpiNodeEntitiesLoadResult.GetError())
		return cUtil.NewFailureResult[[]uint32](err)
	}
	setOfIDsOfKPINodeEntitiesFormingTheDefinition := cUtil.SliceToSet(cUtil.SliceOf(*kpiDefinitionEntity.RootNodeID))
	setOfRemainingKPINodeEntities := cUtil.SliceToSet(kpiNodeEntitiesLoadResult.GetPayload())
	for {
		nextLayerOfKPINodeEntities := cUtil.Filter(setOfRemainingKPINodeEntities.ToSlice(), func(kpiNodeEntity schema.KPINodeEntity) bool {
			parentNodeIDOptional := cUtil.NewOptionalFromPointer(kpiNodeEntity.ParentNodeID)
			if parentNodeIDOptional.IsEmpty() {
				return false
			}
			return setOfIDsOfKPINodeEntitiesFormingTheDefinition.Contains(parentNodeIDOptional.GetPayload())
		})
		if len(nextLayerOfKPINodeEntities) == 0 {
			break
		}
		cUtil.ForEach(nextLayerOfKPINodeEntities, func(kpiNodeEntity schema.KPINodeEntity) {
			setOfIDsOfKPINodeEntitiesFormingTheDefinition.Add(kpiNodeEntity.ID)
			setOfRemainingKPINodeEntities.Delete(kpiNodeEntity)
		})
	}
	return cUtil.NewSuccessResult[[]uint32](setOfIDsOfKPINodeEntitiesFormingTheDefinition.ToSlice())
}

func (r *relationalDatabaseClientImpl) DeleteKPIDefinition(id uint32) error {
	idsOfKPINodeEntitiesFormingTheDefinitionResult := getIDsOfKPINodeEntitiesFormingTheKPIDefinition(r.db, id)
	if idsOfKPINodeEntitiesFormingTheDefinitionResult.IsFailure() {
		return idsOfKPINodeEntitiesFormingTheDefinitionResult.GetError()
	}
	if err := DeleteEntitiesBasedOnSliceOfIds[schema.KPINodeEntity](r.db, idsOfKPINodeEntitiesFormingTheDefinitionResult.GetPayload()); err != nil {
		return err
	}
	return nil
}

func (r *relationalDatabaseClientImpl) PersistSDType(sdTypeDTO types.SDTypeDTO) cUtil.Result[types.SDTypeDTO] {
	sdTypeEntity := dto2db.SDTypeDTOToSDTypeEntity(sdTypeDTO)
	if err := PersistEntityIntoDB[schema.SDTypeEntity](r.db, &sdTypeEntity); err != nil {
		return cUtil.NewFailureResult[types.SDTypeDTO](err)
	}
	return cUtil.NewSuccessResult[types.SDTypeDTO](db2dto.SDTypeEntityToSDTypeDTO(sdTypeEntity))
}

func loadSDType(g *gorm.DB, whereClause WhereClausePair) cUtil.Result[types.SDTypeDTO] {
	sdTypeEntityLoadResult := LoadEntityFromDB[schema.SDTypeEntity](g, PreloadPath("Parameters"), whereClause)
	if sdTypeEntityLoadResult.IsFailure() {
		return cUtil.NewFailureResult[types.SDTypeDTO](sdTypeEntityLoadResult.GetError())
	}
	return cUtil.NewSuccessResult[types.SDTypeDTO](db2dto.SDTypeEntityToSDTypeDTO(sdTypeEntityLoadResult.GetPayload()))
}

func (r *relationalDatabaseClientImpl) LoadSDType(id uint32) cUtil.Result[types.SDTypeDTO] {
	return loadSDType(r.db, WhereClause("id = ?", id))
}

func (r *relationalDatabaseClientImpl) LoadSDTypeBasedOnDenotation(denotation string) cUtil.Result[types.SDTypeDTO] {
	return loadSDType(r.db, WhereClause("denotation = ?", denotation))
}

func (r *relationalDatabaseClientImpl) LoadSDTypes() cUtil.Result[[]types.SDTypeDTO] {
	sdTypeEntitiesLoadResult := LoadEntitiesFromDB[schema.SDTypeEntity](r.db, PreloadPath("Parameters"))
	if sdTypeEntitiesLoadResult.IsFailure() {
		return cUtil.NewFailureResult[[]types.SDTypeDTO](sdTypeEntitiesLoadResult.GetError())
	}
	return cUtil.NewSuccessResult[[]types.SDTypeDTO](cUtil.Map(sdTypeEntitiesLoadResult.GetPayload(), db2dto.SDTypeEntityToSDTypeDTO))
}

func (r *relationalDatabaseClientImpl) DeleteSDType(id uint32) error {
	sdInstanceEntitiesLoadResult := LoadEntitiesFromDB[schema.SDInstanceEntity](r.db, WhereClause("sd_type_id = ?", id))
	if sdInstanceEntitiesLoadResult.IsFailure() {
		return sdInstanceEntitiesLoadResult.GetError()
	}
	tx := r.db.Begin()
	for _, sdInstanceEntity := range sdInstanceEntitiesLoadResult.GetPayload() {
		sdInstanceID := sdInstanceEntity.ID
		if err := DeleteEntitiesBasedOnWhereClauses[schema.KPIFulfillmentCheckResultEntity](tx, WhereClause("sd_instance_id = ?", sdInstanceID)); err != nil {
			tx.Rollback()
			return err
		}
		if err := DeleteCertainEntityBasedOnId[schema.SDInstanceEntity](tx, sdInstanceID); err != nil {
			tx.Rollback()
			return err
		}
	}
	if err := DeleteEntitiesBasedOnWhereClauses[schema.SDParameterEntity](tx, WhereClause("sd_type_id = ?", id)); err != nil {
		tx.Rollback()
		return err
	}
	if err := DeleteCertainEntityBasedOnId[schema.SDTypeEntity](tx, id); err != nil {
		tx.Rollback()
		return err
	}
	tx.Commit()
	return nil
}

func (r *relationalDatabaseClientImpl) PersistSDInstance(sdInstanceDTO types.SDInstanceDTO) cUtil.Result[uint32] {
	sdInstanceEntity := dto2db.SDInstanceDTOToSDInstanceEntity(sdInstanceDTO)
	if err := PersistEntityIntoDB(r.db, &sdInstanceEntity); err != nil {
		return cUtil.NewFailureResult[uint32](err)
	}
	return cUtil.NewSuccessResult[uint32](sdInstanceEntity.ID)
}

func (r *relationalDatabaseClientImpl) LoadSDInstance(id uint32) cUtil.Result[types.SDInstanceDTO] {
	sdInstanceEntityLoadResult := LoadEntityFromDB[schema.SDInstanceEntity](r.db, PreloadPath("SDType"), WhereClause("id = ?", id))
	if sdInstanceEntityLoadResult.IsFailure() {
		return cUtil.NewFailureResult[types.SDInstanceDTO](sdInstanceEntityLoadResult.GetError())
	}
	return cUtil.NewSuccessResult[types.SDInstanceDTO](db2dto.SDInstanceEntityToSDInstanceDTO(sdInstanceEntityLoadResult.GetPayload()))
}

func (r *relationalDatabaseClientImpl) DoesSDInstanceExist(uid string) cUtil.Result[bool] {
	return DoesSuchEntityExist[schema.SDInstanceEntity](r.db, WhereClause("uid = ?", uid))
}

func (r *relationalDatabaseClientImpl) LoadSDInstances() cUtil.Result[[]types.SDInstanceDTO] {
	sdInstanceEntitiesLoadResult := LoadEntitiesFromDB[schema.SDInstanceEntity](r.db, PreloadPath("SDType"))
	if sdInstanceEntitiesLoadResult.IsFailure() {
		return cUtil.NewFailureResult[[]types.SDInstanceDTO](sdInstanceEntitiesLoadResult.GetError())
	}
	return cUtil.NewSuccessResult[[]types.SDInstanceDTO](cUtil.Map(sdInstanceEntitiesLoadResult.GetPayload(), db2dto.SDInstanceEntityToSDInstanceDTO))
}

func (r *relationalDatabaseClientImpl) DeleteSDInstance(id uint32) error {
	// TODO: Implement
	return errors.New("[rdb client] not implemented")
}

func (r *relationalDatabaseClientImpl) PersistKPIFulFulfillmentCheckResult(kpiFulfillmentCheckResultDTO types.KPIFulfillmentCheckResultDTO) cUtil.Result[uint32] {
	kpiFulfillmentCheckEntity := dto2db.KPIFulfillmentCheckResultDTOToKPIFulfillmentCheckResultEntity(kpiFulfillmentCheckResultDTO)
	if err := PersistEntityIntoDB(r.db, &kpiFulfillmentCheckEntity); err != nil {
		return cUtil.NewFailureResult[uint32](err)
	}
	return cUtil.NewSuccessResult[uint32](kpiFulfillmentCheckEntity.ID)
}

func (r *relationalDatabaseClientImpl) LoadKPIFulFulfillmentCheckResult(id uint32) cUtil.Result[types.KPIFulfillmentCheckResultDTO] {
	// TODO: Implement
	return cUtil.NewFailureResult[types.KPIFulfillmentCheckResultDTO](errors.New("[rdb client] not implemented"))
}

func (r *relationalDatabaseClientImpl) LoadKPIFulFulfillmentCheckResults() cUtil.Result[[]types.KPIFulfillmentCheckResultDTO] {
	kpiFulFulfillmentCheckResultEntitiesLoadResult := LoadEntitiesFromDB[schema.KPIFulfillmentCheckResultEntity](r.db, PreloadPath("SDInstance.SDType.Parameters"), PreloadPath("KPIDefinition"))
	if kpiFulFulfillmentCheckResultEntitiesLoadResult.IsFailure() {
		return cUtil.NewFailureResult[[]types.KPIFulfillmentCheckResultDTO](kpiFulFulfillmentCheckResultEntitiesLoadResult.GetError())
	}
	kpiFulFulfillmentCheckResultEntities := kpiFulFulfillmentCheckResultEntitiesLoadResult.GetPayload()
	kpiNodeEntitiesLoadResult := LoadEntitiesFromDB[schema.KPINodeEntity](r.db)
	if kpiNodeEntitiesLoadResult.IsFailure() {
		return cUtil.NewFailureResult[[]types.KPIFulfillmentCheckResultDTO](kpiNodeEntitiesLoadResult.GetError())
	}
	kpiNodeEntities := kpiNodeEntitiesLoadResult.GetPayload()
	logicalOperationKPINodeEntitiesLoadResult := LoadEntitiesFromDB[schema.LogicalOperationKPINodeEntity](r.db)
	if logicalOperationKPINodeEntitiesLoadResult.IsFailure() {
		return cUtil.NewFailureResult[[]types.KPIFulfillmentCheckResultDTO](logicalOperationKPINodeEntitiesLoadResult.GetError())
	}
	logicalOperationKPINodeEntities := logicalOperationKPINodeEntitiesLoadResult.GetPayload()
	atomKPINodeEntitiesLoadResult := LoadEntitiesFromDB[schema.AtomKPINodeEntity](r.db)
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
