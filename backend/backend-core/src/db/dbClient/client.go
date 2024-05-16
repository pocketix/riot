package dbClient

import (
	"errors"
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/dbUtil"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/modelMapping/db2dll"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/modelMapping/dll2db"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/kpi"
	cUtil "github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"sync"
)

const (
	dsn = "host=postgres user=admin password=password dbname=postgres-db port=5432"
)

var (
	rdbClientInstance RelationalDatabaseClient
	once              sync.Once
)

type RelationalDatabaseClient interface {
	setup()
	PersistKPIDefinition(kpiDefinitionDTO kpi.DefinitionDTO) cUtil.Result[uint32] // TODO: Is ID enough?
	LoadKPIDefinition(id uint32) cUtil.Result[kpi.DefinitionDTO]
	LoadKPIDefinitions() cUtil.Result[[]kpi.DefinitionDTO]
	DeleteKPIDefinition(id uint32) error
	PersistSDType(sdTypeDTO dllModel.SDType) cUtil.Result[dllModel.SDType]
	LoadSDType(id uint32) cUtil.Result[dllModel.SDType]
	LoadSDTypeBasedOnDenotation(denotation string) cUtil.Result[dllModel.SDType]
	LoadSDTypes() cUtil.Result[[]dllModel.SDType]
	DeleteSDType(id uint32) error
	PersistSDInstance(sdInstanceDTO dllModel.SDInstance) cUtil.Result[uint32] // TODO: Is ID enough?
	LoadSDInstance(id uint32) cUtil.Result[dllModel.SDInstance]
	LoadSDInstanceBasedOnUID(uid string) cUtil.Result[cUtil.Optional[dllModel.SDInstance]]
	DoesSDInstanceExist(uid string) cUtil.Result[bool]
	LoadSDInstances() cUtil.Result[[]dllModel.SDInstance]
	PersistKPIFulFulfillmentCheckResult(kpiFulfillmentCheckResultDTO dllModel.KPIFulfillmentCheckResult) error
	LoadKPIFulFulfillmentCheckResult(kpiDefinitionID uint32, sdInstanceID uint32) cUtil.Result[cUtil.Optional[dllModel.KPIFulfillmentCheckResult]]
	LoadKPIFulFulfillmentCheckResults() cUtil.Result[[]dllModel.KPIFulfillmentCheckResult]
	LoadSDInstanceGroups() cUtil.Result[[]dllModel.SDInstanceGroup]
	LoadSDInstanceGroup(id uint32) cUtil.Result[dllModel.SDInstanceGroup]
	PersistSDInstanceGroup(sdInstanceGroupDTO dllModel.SDInstanceGroup) cUtil.Result[uint32]
	DeleteSDInstanceGroup(id uint32) error
}

type relationalDatabaseClientImpl struct {
	db *gorm.DB
	mu sync.Mutex
}

func GetRelationalDatabaseClientInstance() RelationalDatabaseClient {
	once.Do(func() {
		rdbClientInstance = new(relationalDatabaseClientImpl)
		rdbClientInstance.setup()
	})
	return rdbClientInstance
}

func (r *relationalDatabaseClientImpl) setup() {
	db, err := gorm.Open(postgres.Open(dsn), new(gorm.Config))
	cUtil.TerminateOnError(err, "[RDB client (GORM)]: couldn't connect to the database")
	session := new(gorm.Session)
	session.Logger = logger.Default.LogMode(logger.Silent)
	r.db = db.Session(session)
	cUtil.TerminateOnError(r.db.AutoMigrate(
		new(dbModel.KPIDefinitionEntity),
		new(dbModel.KPINodeEntity),
		new(dbModel.LogicalOperationKPINodeEntity),
		new(dbModel.AtomKPINodeEntity),
		new(dbModel.SDTypeEntity),
		new(dbModel.SDParameterEntity),
		new(dbModel.SDInstanceEntity),
		new(dbModel.KPIFulfillmentCheckResultEntity),
		new(dbModel.SDInstanceGroupEntity),
		new(dbModel.SDInstanceGroupMembershipEntity),
	), "[RDB client (GORM)]: auto-migration failed")
}

func (r *relationalDatabaseClientImpl) PersistKPIDefinition(kpiDefinitionDTO kpi.DefinitionDTO) cUtil.Result[uint32] {
	r.mu.Lock()
	defer r.mu.Unlock()
	kpiNodeEntity, kpiNodeEntities, logicalOperationNodeEntities, atomNodeEntities := dll2db.TransformKPIDefinitionTree(kpiDefinitionDTO.RootNode, nil, make([]*dbModel.KPINodeEntity, 0), make([]dbModel.LogicalOperationKPINodeEntity, 0), make([]dbModel.AtomKPINodeEntity, 0))
	kpiDefinitionEntity := dbModel.KPIDefinitionEntity{
		SDTypeID:       kpiDefinitionDTO.SDTypeID,
		UserIdentifier: kpiDefinitionDTO.UserIdentifier,
		RootNode:       kpiNodeEntity,
	}
	err := r.db.Transaction(func(tx *gorm.DB) error {
		for _, entity := range kpiNodeEntities {
			if err := dbUtil.PersistEntityIntoDB[dbModel.KPINodeEntity](tx, entity); err != nil {
				return err
			}
		}
		if err := dbUtil.PersistEntityIntoDB[dbModel.KPIDefinitionEntity](tx, &kpiDefinitionEntity); err != nil {
			return err
		}
		for _, entity := range logicalOperationNodeEntities {
			if err := dbUtil.PersistEntityIntoDB[dbModel.LogicalOperationKPINodeEntity](tx, &entity); err != nil {
				return err
			}
		}
		for _, entity := range atomNodeEntities {
			if err := dbUtil.PersistEntityIntoDB[dbModel.AtomKPINodeEntity](tx, &entity); err != nil {
				return err
			}
		}
		return nil
	})
	return cUtil.Ternary(err == nil, cUtil.NewSuccessResult[uint32](kpiDefinitionEntity.ID), cUtil.NewFailureResult[uint32](err))
}

func (r *relationalDatabaseClientImpl) LoadKPIDefinition(id uint32) cUtil.Result[kpi.DefinitionDTO] {
	r.mu.Lock()
	defer r.mu.Unlock()
	// TODO: Implement
	return cUtil.NewFailureResult[kpi.DefinitionDTO](errors.New("[RDB client (GORM)]: not implemented"))
}

func (r *relationalDatabaseClientImpl) LoadKPIDefinitions() cUtil.Result[[]kpi.DefinitionDTO] {
	r.mu.Lock()
	defer r.mu.Unlock()
	kpiDefinitionEntitiesLoadResult := dbUtil.LoadEntitiesFromDB[dbModel.KPIDefinitionEntity](r.db, dbUtil.Preload("SDType"))
	if kpiDefinitionEntitiesLoadResult.IsFailure() {
		err := fmt.Errorf("failed to load KPI definition entities from the database: %w", kpiDefinitionEntitiesLoadResult.GetError())
		return cUtil.NewFailureResult[[]kpi.DefinitionDTO](err)
	}
	kpiDefinitionEntities := kpiDefinitionEntitiesLoadResult.GetPayload()
	kpiNodeEntitiesLoadResult := dbUtil.LoadEntitiesFromDB[dbModel.KPINodeEntity](r.db)
	if kpiNodeEntitiesLoadResult.IsFailure() {
		err := fmt.Errorf("failed to load KPI node entities from the database: %w", kpiNodeEntitiesLoadResult.GetError())
		return cUtil.NewFailureResult[[]kpi.DefinitionDTO](err)
	}
	kpiNodeEntities := kpiNodeEntitiesLoadResult.GetPayload()
	logicalOperationKPINodeEntitiesLoadResult := dbUtil.LoadEntitiesFromDB[dbModel.LogicalOperationKPINodeEntity](r.db)
	if logicalOperationKPINodeEntitiesLoadResult.IsFailure() {
		err := fmt.Errorf("failed to load logical operation KPI node entities from the database: %w", logicalOperationKPINodeEntitiesLoadResult.GetError())
		return cUtil.NewFailureResult[[]kpi.DefinitionDTO](err)
	}
	logicalOperationKPINodeEntities := logicalOperationKPINodeEntitiesLoadResult.GetPayload()
	atomKPINodeEntitiesLoadResult := dbUtil.LoadEntitiesFromDB[dbModel.AtomKPINodeEntity](r.db, dbUtil.Preload("SDParameter"))
	if atomKPINodeEntitiesLoadResult.IsFailure() {
		err := fmt.Errorf("failed to load atom KPI node entities from the database: %w", atomKPINodeEntitiesLoadResult.GetError())
		return cUtil.NewFailureResult[[]kpi.DefinitionDTO](err)
	}
	atomKPINodeEntities := atomKPINodeEntitiesLoadResult.GetPayload()
	kpiDefinitionDTOs := make([]kpi.DefinitionDTO, 0, len(kpiDefinitionEntities))
	cUtil.ForEach(kpiDefinitionEntities, func(kpiDefinitionEntity dbModel.KPIDefinitionEntity) {
		kpiDefinitionDTO := db2dll.ReconstructKPIDefinitionDTO(kpiDefinitionEntity, kpiNodeEntities, logicalOperationKPINodeEntities, atomKPINodeEntities)
		kpiDefinitionDTOs = append(kpiDefinitionDTOs, kpiDefinitionDTO)
	})
	return cUtil.NewSuccessResult[[]kpi.DefinitionDTO](kpiDefinitionDTOs)
}

func getIDsOfKPINodeEntitiesFormingTheKPIDefinition(g *gorm.DB, kpiDefinitionID uint32) cUtil.Result[[]uint32] {
	kpiDefinitionEntityLoadResult := dbUtil.LoadEntityFromDB[dbModel.KPIDefinitionEntity](g, dbUtil.Where("id = ?", kpiDefinitionID))
	if kpiDefinitionEntityLoadResult.IsFailure() {
		err := fmt.Errorf("failed to load KPI definition entity with ID = %d from the database: %w", kpiDefinitionID, kpiDefinitionEntityLoadResult.GetError())
		return cUtil.NewFailureResult[[]uint32](err)
	}
	kpiDefinitionEntity := kpiDefinitionEntityLoadResult.GetPayload()
	kpiNodeEntitiesLoadResult := dbUtil.LoadEntitiesFromDB[dbModel.KPINodeEntity](g)
	if kpiNodeEntitiesLoadResult.IsFailure() {
		err := fmt.Errorf("failed to load KPI node entities from the database: %w", kpiNodeEntitiesLoadResult.GetError())
		return cUtil.NewFailureResult[[]uint32](err)
	}
	setOfIDsOfKPINodeEntitiesFormingTheDefinition := cUtil.NewSetFromSlice(cUtil.SliceOf(*kpiDefinitionEntity.RootNodeID))
	setOfRemainingKPINodeEntities := cUtil.NewSetFromSlice(kpiNodeEntitiesLoadResult.GetPayload())
	for {
		nextLayerOfKPINodeEntities := cUtil.Filter(setOfRemainingKPINodeEntities.ToSlice(), func(kpiNodeEntity dbModel.KPINodeEntity) bool {
			parentNodeIDOptional := cUtil.NewOptionalFromPointer(kpiNodeEntity.ParentNodeID)
			if parentNodeIDOptional.IsEmpty() {
				return false
			}
			return setOfIDsOfKPINodeEntitiesFormingTheDefinition.Contains(parentNodeIDOptional.GetPayload())
		})
		if len(nextLayerOfKPINodeEntities) == 0 {
			break
		}
		cUtil.ForEach(nextLayerOfKPINodeEntities, func(kpiNodeEntity dbModel.KPINodeEntity) {
			setOfIDsOfKPINodeEntitiesFormingTheDefinition.Add(kpiNodeEntity.ID)
			setOfRemainingKPINodeEntities.Delete(kpiNodeEntity)
		})
	}
	return cUtil.NewSuccessResult[[]uint32](setOfIDsOfKPINodeEntitiesFormingTheDefinition.ToSlice())
}

func (r *relationalDatabaseClientImpl) DeleteKPIDefinition(id uint32) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	idsOfKPINodeEntitiesFormingTheDefinitionResult := getIDsOfKPINodeEntitiesFormingTheKPIDefinition(r.db, id)
	if idsOfKPINodeEntitiesFormingTheDefinitionResult.IsFailure() {
		return idsOfKPINodeEntitiesFormingTheDefinitionResult.GetError()
	}
	if err := dbUtil.DeleteEntitiesBasedOnSliceOfIds[dbModel.KPINodeEntity](r.db, idsOfKPINodeEntitiesFormingTheDefinitionResult.GetPayload()); err != nil {
		return err
	}
	return nil
}

func (r *relationalDatabaseClientImpl) PersistSDType(sdTypeDTO dllModel.SDType) cUtil.Result[dllModel.SDType] {
	r.mu.Lock()
	defer r.mu.Unlock()
	sdTypeEntity := dll2db.ToDBModelEntitySDType(sdTypeDTO)
	if err := dbUtil.PersistEntityIntoDB[dbModel.SDTypeEntity](r.db, &sdTypeEntity); err != nil {
		return cUtil.NewFailureResult[dllModel.SDType](err)
	}
	return cUtil.NewSuccessResult[dllModel.SDType](db2dll.ToDLLModelSDType(sdTypeEntity))
}

func loadSDType(g *gorm.DB, whereClause dbUtil.WhereClause) cUtil.Result[dllModel.SDType] {
	sdTypeEntityLoadResult := dbUtil.LoadEntityFromDB[dbModel.SDTypeEntity](g, dbUtil.Preload("Parameters"), whereClause)
	if sdTypeEntityLoadResult.IsFailure() {
		return cUtil.NewFailureResult[dllModel.SDType](sdTypeEntityLoadResult.GetError())
	}
	return cUtil.NewSuccessResult[dllModel.SDType](db2dll.ToDLLModelSDType(sdTypeEntityLoadResult.GetPayload()))
}

func (r *relationalDatabaseClientImpl) LoadSDType(id uint32) cUtil.Result[dllModel.SDType] {
	r.mu.Lock()
	defer r.mu.Unlock()
	return loadSDType(r.db, dbUtil.Where("id = ?", id))
}

func (r *relationalDatabaseClientImpl) LoadSDTypeBasedOnDenotation(denotation string) cUtil.Result[dllModel.SDType] {
	r.mu.Lock()
	defer r.mu.Unlock()
	return loadSDType(r.db, dbUtil.Where("denotation = ?", denotation))
}

func (r *relationalDatabaseClientImpl) LoadSDTypes() cUtil.Result[[]dllModel.SDType] {
	r.mu.Lock()
	defer r.mu.Unlock()
	sdTypeEntitiesLoadResult := dbUtil.LoadEntitiesFromDB[dbModel.SDTypeEntity](r.db, dbUtil.Preload("Parameters"))
	if sdTypeEntitiesLoadResult.IsFailure() {
		return cUtil.NewFailureResult[[]dllModel.SDType](sdTypeEntitiesLoadResult.GetError())
	}
	return cUtil.NewSuccessResult[[]dllModel.SDType](cUtil.Map(sdTypeEntitiesLoadResult.GetPayload(), db2dll.ToDLLModelSDType))
}

func (r *relationalDatabaseClientImpl) DeleteSDType(id uint32) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	return r.db.Transaction(func(tx *gorm.DB) error {
		relatedKPIDefinitionEntitiesLoadResult := dbUtil.LoadEntitiesFromDB[dbModel.KPIDefinitionEntity](tx, dbUtil.Where("sd_type_id = ?", id))
		if relatedKPIDefinitionEntitiesLoadResult.IsFailure() {
			return fmt.Errorf("failed to load KPI definition entities related to the SD type with ID = %d from the database: %w", id, relatedKPIDefinitionEntitiesLoadResult.GetError())
		}
		if err := dbUtil.DeleteCertainEntityBasedOnId[dbModel.SDTypeEntity](tx, id); err != nil {
			return fmt.Errorf("failed to delete SD type entity with ID = %d from the database: %w", id, err)
		}
		relatedKPIDefinitionEntities := relatedKPIDefinitionEntitiesLoadResult.GetPayload()
		for _, relatedKPIDefinitionEntity := range relatedKPIDefinitionEntities {
			rootNodeID := cUtil.NewOptionalFromPointer(relatedKPIDefinitionEntity.RootNodeID).GetPayload()
			if err := dbUtil.DeleteCertainEntityBasedOnId[dbModel.KPINodeEntity](tx, rootNodeID); err != nil {
				return fmt.Errorf("failed to delete KPI node entity with ID = %d from the database: %w", rootNodeID, err)
			}
		}
		return nil
	})
}

func (r *relationalDatabaseClientImpl) PersistSDInstance(sdInstanceDTO dllModel.SDInstance) cUtil.Result[uint32] {
	r.mu.Lock()
	defer r.mu.Unlock()
	sdInstanceEntity := dll2db.ToDBModelEntitySDInstance(sdInstanceDTO)
	if err := dbUtil.PersistEntityIntoDB(r.db, &sdInstanceEntity); err != nil {
		return cUtil.NewFailureResult[uint32](err)
	}
	return cUtil.NewSuccessResult[uint32](sdInstanceEntity.ID)
}

func (r *relationalDatabaseClientImpl) LoadSDInstance(id uint32) cUtil.Result[dllModel.SDInstance] {
	r.mu.Lock()
	defer r.mu.Unlock()
	sdInstanceEntityLoadResult := dbUtil.LoadEntityFromDB[dbModel.SDInstanceEntity](r.db, dbUtil.Preload("SDType"), dbUtil.Where("id = ?", id))
	if sdInstanceEntityLoadResult.IsFailure() {
		return cUtil.NewFailureResult[dllModel.SDInstance](sdInstanceEntityLoadResult.GetError())
	}
	return cUtil.NewSuccessResult[dllModel.SDInstance](db2dll.ToDLLModelSDInstance(sdInstanceEntityLoadResult.GetPayload()))
}

func (r *relationalDatabaseClientImpl) LoadSDInstanceBasedOnUID(uid string) cUtil.Result[cUtil.Optional[dllModel.SDInstance]] {
	r.mu.Lock()
	defer r.mu.Unlock()
	sdInstanceEntityLoadResult := dbUtil.LoadEntityFromDB[dbModel.SDInstanceEntity](r.db, dbUtil.Preload("SDType"), dbUtil.Where("uid = ?", uid))
	if sdInstanceEntityLoadResult.IsFailure() {
		err := sdInstanceEntityLoadResult.GetError()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return cUtil.NewSuccessResult[cUtil.Optional[dllModel.SDInstance]](cUtil.NewEmptyOptional[dllModel.SDInstance]())
		} else {
			return cUtil.NewFailureResult[cUtil.Optional[dllModel.SDInstance]](err)
		}
	}
	return cUtil.NewSuccessResult[cUtil.Optional[dllModel.SDInstance]](cUtil.NewOptionalOf(db2dll.ToDLLModelSDInstance(sdInstanceEntityLoadResult.GetPayload())))
}

func (r *relationalDatabaseClientImpl) DoesSDInstanceExist(uid string) cUtil.Result[bool] {
	r.mu.Lock()
	defer r.mu.Unlock()
	return dbUtil.DoesSuchEntityExist[dbModel.SDInstanceEntity](r.db, dbUtil.Where("uid = ?", uid))
}

func (r *relationalDatabaseClientImpl) LoadSDInstances() cUtil.Result[[]dllModel.SDInstance] {
	r.mu.Lock()
	defer r.mu.Unlock()
	sdInstanceEntitiesLoadResult := dbUtil.LoadEntitiesFromDB[dbModel.SDInstanceEntity](r.db, dbUtil.Preload("SDType"))
	if sdInstanceEntitiesLoadResult.IsFailure() {
		return cUtil.NewFailureResult[[]dllModel.SDInstance](sdInstanceEntitiesLoadResult.GetError())
	}
	return cUtil.NewSuccessResult[[]dllModel.SDInstance](cUtil.Map(sdInstanceEntitiesLoadResult.GetPayload(), db2dll.ToDLLModelSDInstance))
}

func (r *relationalDatabaseClientImpl) PersistKPIFulFulfillmentCheckResult(kpiFulfillmentCheckResultDTO dllModel.KPIFulfillmentCheckResult) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	kpiFulfillmentCheckEntity := dll2db.ToDBModelEntityKPIFulfillmentCheckResult(kpiFulfillmentCheckResultDTO)
	return dbUtil.PersistEntityIntoDB(r.db, &kpiFulfillmentCheckEntity)
}

func (r *relationalDatabaseClientImpl) LoadKPIFulFulfillmentCheckResult(kpiDefinitionID uint32, sdInstanceID uint32) cUtil.Result[cUtil.Optional[dllModel.KPIFulfillmentCheckResult]] {
	r.mu.Lock()
	defer r.mu.Unlock()
	kpiFulFulfillmentCheckResultEntityLoadResult := dbUtil.LoadEntityFromDB[dbModel.KPIFulfillmentCheckResultEntity](r.db, dbUtil.Where("kpi_definition_id = ?", kpiDefinitionID), dbUtil.Where("sd_instance_id = ?", sdInstanceID))
	if kpiFulFulfillmentCheckResultEntityLoadResult.IsFailure() {
		err := kpiFulFulfillmentCheckResultEntityLoadResult.GetError()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return cUtil.NewSuccessResult[cUtil.Optional[dllModel.KPIFulfillmentCheckResult]](cUtil.NewEmptyOptional[dllModel.KPIFulfillmentCheckResult]())
		} else {
			return cUtil.NewFailureResult[cUtil.Optional[dllModel.KPIFulfillmentCheckResult]](err)
		}
	}
	return cUtil.NewSuccessResult[cUtil.Optional[dllModel.KPIFulfillmentCheckResult]](cUtil.NewOptionalOf(db2dll.ToDLLModelKPIFulfillmentCheckResult(kpiFulFulfillmentCheckResultEntityLoadResult.GetPayload())))
}

func (r *relationalDatabaseClientImpl) LoadKPIFulFulfillmentCheckResults() cUtil.Result[[]dllModel.KPIFulfillmentCheckResult] {
	r.mu.Lock()
	defer r.mu.Unlock()
	kpiFulFulfillmentCheckResultEntitiesLoadResult := dbUtil.LoadEntitiesFromDB[dbModel.KPIFulfillmentCheckResultEntity](r.db)
	if kpiFulFulfillmentCheckResultEntitiesLoadResult.IsFailure() {
		return cUtil.NewFailureResult[[]dllModel.KPIFulfillmentCheckResult](kpiFulFulfillmentCheckResultEntitiesLoadResult.GetError())
	}
	return cUtil.NewSuccessResult[[]dllModel.KPIFulfillmentCheckResult](cUtil.Map(kpiFulFulfillmentCheckResultEntitiesLoadResult.GetPayload(), db2dll.ToDLLModelKPIFulfillmentCheckResult))
}

func (r *relationalDatabaseClientImpl) LoadSDInstanceGroups() cUtil.Result[[]dllModel.SDInstanceGroup] {
	r.mu.Lock()
	defer r.mu.Unlock()
	sdInstanceGroupEntitiesLoadResult := dbUtil.LoadEntitiesFromDB[dbModel.SDInstanceGroupEntity](r.db, dbUtil.Preload("GroupMembershipRecords"))
	if sdInstanceGroupEntitiesLoadResult.IsFailure() {
		return cUtil.NewFailureResult[[]dllModel.SDInstanceGroup](sdInstanceGroupEntitiesLoadResult.GetError())
	}
	return cUtil.NewSuccessResult(cUtil.Map(sdInstanceGroupEntitiesLoadResult.GetPayload(), db2dll.ToDLLModelSDInstanceGroup))
}

func (r *relationalDatabaseClientImpl) LoadSDInstanceGroup(id uint32) cUtil.Result[dllModel.SDInstanceGroup] {
	r.mu.Lock()
	defer r.mu.Unlock()
	sdInstanceGroupEntityLoadResult := dbUtil.LoadEntityFromDB[dbModel.SDInstanceGroupEntity](r.db, dbUtil.Preload("GroupMembershipRecords"), dbUtil.Where("id = ?", id))
	if sdInstanceGroupEntityLoadResult.IsFailure() {
		return cUtil.NewFailureResult[dllModel.SDInstanceGroup](sdInstanceGroupEntityLoadResult.GetError())
	}
	return cUtil.NewSuccessResult(db2dll.ToDLLModelSDInstanceGroup(sdInstanceGroupEntityLoadResult.GetPayload()))
}

func (r *relationalDatabaseClientImpl) PersistSDInstanceGroup(sdInstanceGroupDTO dllModel.SDInstanceGroup) cUtil.Result[uint32] {
	r.mu.Lock()
	defer r.mu.Unlock()
	sdInstanceGroupEntity := dll2db.ToDBModelEntitySDInstanceGroup(sdInstanceGroupDTO)
	if err := dbUtil.PersistEntityIntoDB(r.db, &sdInstanceGroupEntity); err != nil {
		return cUtil.NewFailureResult[uint32](err)
	}
	return cUtil.NewSuccessResult[uint32](sdInstanceGroupEntity.ID)
}

func (r *relationalDatabaseClientImpl) DeleteSDInstanceGroup(id uint32) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	return dbUtil.DeleteCertainEntityBasedOnId[dbModel.SDInstanceGroupEntity](r.db, id)
}
