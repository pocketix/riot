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
	PersistSDType(sdTypeDTO types.SDTypeDTO) cUtil.Result[types.SDTypeDTO]
	LoadSDType(id uint32) cUtil.Result[types.SDTypeDTO]
	LoadSDTypeBasedOnDenotation(denotation string) cUtil.Result[types.SDTypeDTO]
	LoadSDTypes() cUtil.Result[[]types.SDTypeDTO]
	DeleteSDType(id uint32) error
	PersistSDInstance(sdInstanceDTO types.SDInstanceDTO) cUtil.Result[uint32] // TODO: Is ID enough?
	LoadSDInstance(id uint32) cUtil.Result[types.SDInstanceDTO]
	LoadSDInstanceBasedOnUID(uid string) cUtil.Result[cUtil.Optional[types.SDInstanceDTO]]
	DoesSDInstanceExist(uid string) cUtil.Result[bool]
	LoadSDInstances() cUtil.Result[[]types.SDInstanceDTO]
	PersistKPIFulFulfillmentCheckResult(kpiFulfillmentCheckResultDTO types.KPIFulfillmentCheckResultDTO) error
	LoadKPIFulFulfillmentCheckResult(kpiDefinitionID uint32, sdInstanceID uint32) cUtil.Result[cUtil.Optional[types.KPIFulfillmentCheckResultDTO]]
	LoadKPIFulFulfillmentCheckResults() cUtil.Result[[]types.KPIFulfillmentCheckResultDTO]
	LoadSDInstanceGroups() cUtil.Result[[]types.SDInstanceGroupDTO]
	LoadSDInstanceGroup(id uint32) cUtil.Result[types.SDInstanceGroupDTO]
	PersistSDInstanceGroup(sdInstanceGroupDTO types.SDInstanceGroupDTO) cUtil.Result[uint32]
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
		new(schema.KPIDefinitionEntity),
		new(schema.KPINodeEntity),
		new(schema.LogicalOperationKPINodeEntity),
		new(schema.AtomKPINodeEntity),
		new(schema.SDTypeEntity),
		new(schema.SDParameterEntity),
		new(schema.SDInstanceEntity),
		new(schema.KPIFulfillmentCheckResultEntity),
		new(schema.SDInstanceGroupEntity),
		new(schema.SDInstanceGroupMembershipEntity),
	), "[RDB client (GORM)]: auto-migration failed")
}

func (r *relationalDatabaseClientImpl) PersistKPIDefinition(kpiDefinitionDTO kpi.DefinitionDTO) cUtil.Result[uint32] {
	r.mu.Lock()
	defer r.mu.Unlock()
	kpiNodeEntity, kpiNodeEntities, logicalOperationNodeEntities, atomNodeEntities := dto2db.TransformKPIDefinitionTree(kpiDefinitionDTO.RootNode, nil, make([]*schema.KPINodeEntity, 0), make([]schema.LogicalOperationKPINodeEntity, 0), make([]schema.AtomKPINodeEntity, 0))
	kpiDefinitionEntity := schema.KPIDefinitionEntity{
		SDTypeID:       kpiDefinitionDTO.SDTypeID,
		UserIdentifier: kpiDefinitionDTO.UserIdentifier,
		RootNode:       kpiNodeEntity,
	}
	err := r.db.Transaction(func(tx *gorm.DB) error {
		for _, entity := range kpiNodeEntities {
			if err := PersistEntityIntoDB[schema.KPINodeEntity](tx, entity); err != nil {
				return err
			}
		}
		if err := PersistEntityIntoDB[schema.KPIDefinitionEntity](tx, &kpiDefinitionEntity); err != nil {
			return err
		}
		for _, entity := range logicalOperationNodeEntities {
			if err := PersistEntityIntoDB[schema.LogicalOperationKPINodeEntity](tx, &entity); err != nil {
				return err
			}
		}
		for _, entity := range atomNodeEntities {
			if err := PersistEntityIntoDB[schema.AtomKPINodeEntity](tx, &entity); err != nil {
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
	kpiDefinitionEntitiesLoadResult := LoadEntitiesFromDB[schema.KPIDefinitionEntity](r.db, PreloadPaths("SDType"))
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
	atomKPINodeEntitiesLoadResult := LoadEntitiesFromDB[schema.AtomKPINodeEntity](r.db, PreloadPaths("SDParameter"))
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
	setOfIDsOfKPINodeEntitiesFormingTheDefinition := cUtil.NewSetFromSlice(cUtil.SliceOf(*kpiDefinitionEntity.RootNodeID))
	setOfRemainingKPINodeEntities := cUtil.NewSetFromSlice(kpiNodeEntitiesLoadResult.GetPayload())
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
	r.mu.Lock()
	defer r.mu.Unlock()
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
	r.mu.Lock()
	defer r.mu.Unlock()
	sdTypeEntity := dto2db.SDTypeDTOToSDTypeEntity(sdTypeDTO)
	if err := PersistEntityIntoDB[schema.SDTypeEntity](r.db, &sdTypeEntity); err != nil {
		return cUtil.NewFailureResult[types.SDTypeDTO](err)
	}
	return cUtil.NewSuccessResult[types.SDTypeDTO](db2dto.SDTypeEntityToSDTypeDTO(sdTypeEntity))
}

func loadSDType(g *gorm.DB, whereClause WhereClausePair) cUtil.Result[types.SDTypeDTO] {
	sdTypeEntityLoadResult := LoadEntityFromDB[schema.SDTypeEntity](g, PreloadPaths("Parameters"), whereClause)
	if sdTypeEntityLoadResult.IsFailure() {
		return cUtil.NewFailureResult[types.SDTypeDTO](sdTypeEntityLoadResult.GetError())
	}
	return cUtil.NewSuccessResult[types.SDTypeDTO](db2dto.SDTypeEntityToSDTypeDTO(sdTypeEntityLoadResult.GetPayload()))
}

func (r *relationalDatabaseClientImpl) LoadSDType(id uint32) cUtil.Result[types.SDTypeDTO] {
	r.mu.Lock()
	defer r.mu.Unlock()
	return loadSDType(r.db, WhereClause("id = ?", id))
}

func (r *relationalDatabaseClientImpl) LoadSDTypeBasedOnDenotation(denotation string) cUtil.Result[types.SDTypeDTO] {
	r.mu.Lock()
	defer r.mu.Unlock()
	return loadSDType(r.db, WhereClause("denotation = ?", denotation))
}

func (r *relationalDatabaseClientImpl) LoadSDTypes() cUtil.Result[[]types.SDTypeDTO] {
	r.mu.Lock()
	defer r.mu.Unlock()
	sdTypeEntitiesLoadResult := LoadEntitiesFromDB[schema.SDTypeEntity](r.db, PreloadPaths("Parameters"))
	if sdTypeEntitiesLoadResult.IsFailure() {
		return cUtil.NewFailureResult[[]types.SDTypeDTO](sdTypeEntitiesLoadResult.GetError())
	}
	return cUtil.NewSuccessResult[[]types.SDTypeDTO](cUtil.Map(sdTypeEntitiesLoadResult.GetPayload(), db2dto.SDTypeEntityToSDTypeDTO))
}

func (r *relationalDatabaseClientImpl) DeleteSDType(id uint32) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	return r.db.Transaction(func(tx *gorm.DB) error {
		relatedKPIDefinitionEntitiesLoadResult := LoadEntitiesFromDB[schema.KPIDefinitionEntity](tx, WhereClause("sd_type_id = ?", id))
		if relatedKPIDefinitionEntitiesLoadResult.IsFailure() {
			return fmt.Errorf("failed to load KPI definition entities related to the SD type with ID = %d from the database: %w", id, relatedKPIDefinitionEntitiesLoadResult.GetError())
		}
		if err := DeleteCertainEntityBasedOnId[schema.SDTypeEntity](tx, id); err != nil {
			return fmt.Errorf("failed to delete SD type entity with ID = %d from the database: %w", id, err)
		}
		relatedKPIDefinitionEntities := relatedKPIDefinitionEntitiesLoadResult.GetPayload()
		for _, relatedKPIDefinitionEntity := range relatedKPIDefinitionEntities {
			rootNodeID := cUtil.NewOptionalFromPointer(relatedKPIDefinitionEntity.RootNodeID).GetPayload()
			if err := DeleteCertainEntityBasedOnId[schema.KPINodeEntity](tx, rootNodeID); err != nil {
				return fmt.Errorf("failed to delete KPI node entity with ID = %d from the database: %w", rootNodeID, err)
			}
		}
		return nil
	})
}

func (r *relationalDatabaseClientImpl) PersistSDInstance(sdInstanceDTO types.SDInstanceDTO) cUtil.Result[uint32] {
	r.mu.Lock()
	defer r.mu.Unlock()
	sdInstanceEntity := dto2db.SDInstanceDTOToSDInstanceEntity(sdInstanceDTO)
	if err := PersistEntityIntoDB(r.db, &sdInstanceEntity); err != nil {
		return cUtil.NewFailureResult[uint32](err)
	}
	return cUtil.NewSuccessResult[uint32](sdInstanceEntity.ID)
}

func (r *relationalDatabaseClientImpl) LoadSDInstance(id uint32) cUtil.Result[types.SDInstanceDTO] {
	r.mu.Lock()
	defer r.mu.Unlock()
	sdInstanceEntityLoadResult := LoadEntityFromDB[schema.SDInstanceEntity](r.db, PreloadPaths("SDType"), WhereClause("id = ?", id))
	if sdInstanceEntityLoadResult.IsFailure() {
		return cUtil.NewFailureResult[types.SDInstanceDTO](sdInstanceEntityLoadResult.GetError())
	}
	return cUtil.NewSuccessResult[types.SDInstanceDTO](db2dto.SDInstanceEntityToSDInstanceDTO(sdInstanceEntityLoadResult.GetPayload()))
}

func (r *relationalDatabaseClientImpl) LoadSDInstanceBasedOnUID(uid string) cUtil.Result[cUtil.Optional[types.SDInstanceDTO]] {
	r.mu.Lock()
	defer r.mu.Unlock()
	sdInstanceEntityLoadResult := LoadEntityFromDB[schema.SDInstanceEntity](r.db, PreloadPaths("SDType"), WhereClause("uid = ?", uid))
	if sdInstanceEntityLoadResult.IsFailure() {
		err := sdInstanceEntityLoadResult.GetError()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return cUtil.NewSuccessResult[cUtil.Optional[types.SDInstanceDTO]](cUtil.NewEmptyOptional[types.SDInstanceDTO]())
		} else {
			return cUtil.NewFailureResult[cUtil.Optional[types.SDInstanceDTO]](err)
		}
	}
	return cUtil.NewSuccessResult[cUtil.Optional[types.SDInstanceDTO]](cUtil.NewOptionalOf(db2dto.SDInstanceEntityToSDInstanceDTO(sdInstanceEntityLoadResult.GetPayload())))
}

func (r *relationalDatabaseClientImpl) DoesSDInstanceExist(uid string) cUtil.Result[bool] {
	r.mu.Lock()
	defer r.mu.Unlock()
	return DoesSuchEntityExist[schema.SDInstanceEntity](r.db, WhereClause("uid = ?", uid))
}

func (r *relationalDatabaseClientImpl) LoadSDInstances() cUtil.Result[[]types.SDInstanceDTO] {
	r.mu.Lock()
	defer r.mu.Unlock()
	sdInstanceEntitiesLoadResult := LoadEntitiesFromDB[schema.SDInstanceEntity](r.db, PreloadPaths("SDType"))
	if sdInstanceEntitiesLoadResult.IsFailure() {
		return cUtil.NewFailureResult[[]types.SDInstanceDTO](sdInstanceEntitiesLoadResult.GetError())
	}
	return cUtil.NewSuccessResult[[]types.SDInstanceDTO](cUtil.Map(sdInstanceEntitiesLoadResult.GetPayload(), db2dto.SDInstanceEntityToSDInstanceDTO))
}

func (r *relationalDatabaseClientImpl) PersistKPIFulFulfillmentCheckResult(kpiFulfillmentCheckResultDTO types.KPIFulfillmentCheckResultDTO) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	kpiFulfillmentCheckEntity := dto2db.KPIFulfillmentCheckResultDTOToKPIFulfillmentCheckResultEntity(kpiFulfillmentCheckResultDTO)
	return PersistEntityIntoDB(r.db, &kpiFulfillmentCheckEntity)
}

func (r *relationalDatabaseClientImpl) LoadKPIFulFulfillmentCheckResult(kpiDefinitionID uint32, sdInstanceID uint32) cUtil.Result[cUtil.Optional[types.KPIFulfillmentCheckResultDTO]] {
	r.mu.Lock()
	defer r.mu.Unlock()
	kpiFulFulfillmentCheckResultEntityLoadResult := LoadEntityFromDB[schema.KPIFulfillmentCheckResultEntity](r.db, WhereClause("kpi_definition_id = ? and sd_instance_id = ?", kpiDefinitionID, sdInstanceID))
	if kpiFulFulfillmentCheckResultEntityLoadResult.IsFailure() {
		err := kpiFulFulfillmentCheckResultEntityLoadResult.GetError()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return cUtil.NewSuccessResult[cUtil.Optional[types.KPIFulfillmentCheckResultDTO]](cUtil.NewEmptyOptional[types.KPIFulfillmentCheckResultDTO]())
		} else {
			return cUtil.NewFailureResult[cUtil.Optional[types.KPIFulfillmentCheckResultDTO]](err)
		}
	}
	return cUtil.NewSuccessResult[cUtil.Optional[types.KPIFulfillmentCheckResultDTO]](cUtil.NewOptionalOf(db2dto.KPIFulfillmentCheckResultEntityToKPIFulfillmentCheckResultDTO(kpiFulFulfillmentCheckResultEntityLoadResult.GetPayload())))
}

func (r *relationalDatabaseClientImpl) LoadKPIFulFulfillmentCheckResults() cUtil.Result[[]types.KPIFulfillmentCheckResultDTO] {
	r.mu.Lock()
	defer r.mu.Unlock()
	kpiFulFulfillmentCheckResultEntitiesLoadResult := LoadEntitiesFromDB[schema.KPIFulfillmentCheckResultEntity](r.db)
	if kpiFulFulfillmentCheckResultEntitiesLoadResult.IsFailure() {
		return cUtil.NewFailureResult[[]types.KPIFulfillmentCheckResultDTO](kpiFulFulfillmentCheckResultEntitiesLoadResult.GetError())
	}
	return cUtil.NewSuccessResult[[]types.KPIFulfillmentCheckResultDTO](cUtil.Map(kpiFulFulfillmentCheckResultEntitiesLoadResult.GetPayload(), db2dto.KPIFulfillmentCheckResultEntityToKPIFulfillmentCheckResultDTO))
}

func (r *relationalDatabaseClientImpl) LoadSDInstanceGroups() cUtil.Result[[]types.SDInstanceGroupDTO] {
	r.mu.Lock()
	defer r.mu.Unlock()
	sdInstanceGroupEntitiesLoadResult := LoadEntitiesFromDB[schema.SDInstanceGroupEntity](r.db, PreloadPaths("GroupMembershipRecords"))
	if sdInstanceGroupEntitiesLoadResult.IsFailure() {
		return cUtil.NewFailureResult[[]types.SDInstanceGroupDTO](sdInstanceGroupEntitiesLoadResult.GetError())
	}
	return cUtil.NewSuccessResult(cUtil.Map(sdInstanceGroupEntitiesLoadResult.GetPayload(), db2dto.SDInstanceGroupEntityToSDInstanceGroupDTO))
}

func (r *relationalDatabaseClientImpl) LoadSDInstanceGroup(id uint32) cUtil.Result[types.SDInstanceGroupDTO] {
	r.mu.Lock()
	defer r.mu.Unlock()
	sdInstanceGroupEntityLoadResult := LoadEntityFromDB[schema.SDInstanceGroupEntity](r.db, PreloadPaths("GroupMembershipRecords"), WhereClause("id = ?", id))
	if sdInstanceGroupEntityLoadResult.IsFailure() {
		return cUtil.NewFailureResult[types.SDInstanceGroupDTO](sdInstanceGroupEntityLoadResult.GetError())
	}
	return cUtil.NewSuccessResult(db2dto.SDInstanceGroupEntityToSDInstanceGroupDTO(sdInstanceGroupEntityLoadResult.GetPayload()))
}

func (r *relationalDatabaseClientImpl) PersistSDInstanceGroup(sdInstanceGroupDTO types.SDInstanceGroupDTO) cUtil.Result[uint32] {
	r.mu.Lock()
	defer r.mu.Unlock()
	sdInstanceGroupEntity := dto2db.SDInstanceGroupDTOToSDInstanceGroupEntity(sdInstanceGroupDTO)
	if err := PersistEntityIntoDB(r.db, &sdInstanceGroupEntity); err != nil {
		return cUtil.NewFailureResult[uint32](err)
	}
	return cUtil.NewSuccessResult[uint32](sdInstanceGroupEntity.ID)
}

func (r *relationalDatabaseClientImpl) DeleteSDInstanceGroup(id uint32) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	return DeleteCertainEntityBasedOnId[schema.SDInstanceGroupEntity](r.db, id)
}
