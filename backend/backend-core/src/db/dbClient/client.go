package dbClient

import (
	"errors"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/db/dbUtil"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/modelMapping/db2dll"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/modelMapping/dll2db"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var (
	rdbClientInstance RelationalDatabaseClient
	once              sync.Once
)

type RelationalDatabaseClient interface {
	setup()
	PersistKPIDefinition(kpiDefinition sharedModel.KPIDefinition) sharedUtils.Result[uint32]
	LoadKPIDefinition(id uint32) sharedUtils.Result[sharedModel.KPIDefinition]
	LoadKPIDefinitions() sharedUtils.Result[[]sharedModel.KPIDefinition]
	DeleteKPIDefinition(id uint32) error
	PersistSDType(sdType dllModel.SDType) sharedUtils.Result[dllModel.SDType]
	LoadSDType(id uint32) sharedUtils.Result[dllModel.SDType]
	LoadSDTypeBasedOnDenotation(denotation string) sharedUtils.Result[dllModel.SDType]
	LoadSDTypes() sharedUtils.Result[[]dllModel.SDType]
	DeleteSDType(id uint32) error
	PersistSDInstance(sdInstance dllModel.SDInstance) sharedUtils.Result[uint32]
	PersistNewSDInstance(uid string, sdTypeSpecification string) sharedUtils.Result[dllModel.SDInstance]
	LoadSDInstance(id uint32) sharedUtils.Result[dllModel.SDInstance]
	LoadSDInstanceBasedOnUID(uid string) sharedUtils.Result[sharedUtils.Optional[dllModel.SDInstance]]
	LoadSDInstances() sharedUtils.Result[[]dllModel.SDInstance]
	PersistKPIFulFulfillmentCheckResultTuple(sdInstanceUID string, kpiDefinitionIDs []uint32, fulfillmentStatuses []bool) sharedUtils.Result[[]dllModel.KPIFulfillmentCheckResult]
	LoadKPIFulFulfillmentCheckResult(kpiDefinitionID uint32, sdInstanceID uint32) sharedUtils.Result[sharedUtils.Optional[dllModel.KPIFulfillmentCheckResult]]
	LoadKPIFulFulfillmentCheckResults() sharedUtils.Result[[]dllModel.KPIFulfillmentCheckResult]
	LoadSDInstanceGroups() sharedUtils.Result[[]dllModel.SDInstanceGroup]
	LoadSDInstanceGroup(id uint32) sharedUtils.Result[dllModel.SDInstanceGroup]
	PersistSDInstanceGroup(sdInstanceGroup dllModel.SDInstanceGroup) sharedUtils.Result[uint32]
	DeleteSDInstanceGroup(id uint32) error
	PersistUser(user dllModel.User) sharedUtils.Result[uint]
	LoadUserBasedOnOAuth2ProviderIssuedID(oauth2ProviderIssuedID string) sharedUtils.Result[sharedUtils.Optional[dllModel.User]]
	LoadUser(id uint) sharedUtils.Result[dllModel.User]
	LoadUserSessionBasedOnRefreshTokenHash(refreshTokenHash string) sharedUtils.Result[sharedUtils.Optional[dllModel.UserSession]]
	PersistUserSession(userSession dllModel.UserSession) sharedUtils.Result[uint]
	PersistUserConfig(userConfig dllModel.UserConfig) sharedUtils.Result[uint32]
	LoadUserConfig(userId uint32) sharedUtils.Result[dllModel.UserConfig]
	DeleteUserConfig(userId uint32) error
	LoadSDCommandInvocation(id uint32) sharedUtils.Result[dllModel.SDCommandInvocation]
	LoadSDCommandInvocations() sharedUtils.Result[[]dllModel.SDCommandInvocation]
	PersistSDCommandInvocation(sdCommandInvocation *dllModel.SDCommandInvocation) sharedUtils.Result[uint32]
	InvokeCommand(id uint32) sharedUtils.Result[bool]
	CreateSDCommand(sdCommand dllModel.SDCommand) sharedUtils.Result[uint32]
	LoadSDCommand(id uint32) sharedUtils.Result[dllModel.SDCommand]
	PersistSDCommand(sdCommand dllModel.SDCommand) sharedUtils.Result[uint32]
	DeleteSDCommand(id uint32) error
	LoadSDCommands() sharedUtils.Result[[]dllModel.SDCommand]
	PersistSDParameterSnapshot(snapshot dllModel.SDParameterSnapshot) sharedUtils.Result[sharedUtils.Pair[uint32, uint32]]
	PersistVPLProgram(vplProgram dllModel.VPLProgram) sharedUtils.Result[dllModel.VPLProgram]
	LoadVPLProgram(id uint32) sharedUtils.Result[dllModel.VPLProgram]
	LoadVPLPrograms() sharedUtils.Result[[]dllModel.VPLProgram]
	DeleteVPLProgram(id uint32) error
	PersistVPLProcedure(vplProcedure dllModel.VPLProcedure) sharedUtils.Result[dllModel.VPLProcedure]
	LoadVPLProcedure(id uint32) sharedUtils.Result[dllModel.VPLProcedure]
	LoadVPLProcedures() sharedUtils.Result[[]dllModel.VPLProcedure]
	DeleteVPLProcedure(id uint32) error
	LinkProgramToProcedure(programID uint32, procedureID uint32) error
	UnlinkProgramFromProcedure(programID uint32, procedureID uint32) error
	GetProceduresForProgram(programID uint32) sharedUtils.Result[[]dllModel.VPLProcedure]
	GetProgramsForProcedure(procedureID uint32) sharedUtils.Result[[]dllModel.VPLProgram]
}

var ErrOperationWouldLeadToForeignKeyIntegrityBreach = errors.New("operation would lead to foreign key integrity breach")

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

func (r *relationalDatabaseClientImpl) LoadSDCommandInvocation(id uint32) sharedUtils.Result[dllModel.SDCommandInvocation] {
	r.mu.Lock()
	defer r.mu.Unlock()
	result := dbUtil.LoadEntityFromDB[dbModel.SDCommandInvocationEntity](r.db, dbUtil.Where("id = ?", id))
	if result.IsFailure() {
		return sharedUtils.NewFailureResult[dllModel.SDCommandInvocation](result.GetError())
	}
	return sharedUtils.NewSuccessResult[dllModel.SDCommandInvocation](db2dll.ToDLLModelSDCommandInvocation(result.GetPayload()))
}

func (r *relationalDatabaseClientImpl) LoadSDCommandInvocations() sharedUtils.Result[[]dllModel.SDCommandInvocation] {
	r.mu.Lock()
	defer r.mu.Unlock()
	result := dbUtil.LoadEntitiesFromDB[dbModel.SDCommandInvocationEntity](r.db)
	if result.IsFailure() {
		return sharedUtils.NewFailureResult[[]dllModel.SDCommandInvocation](result.GetError())
	}
	return sharedUtils.NewSuccessResult(sharedUtils.Map(result.GetPayload(), db2dll.ToDLLModelSDCommandInvocation))
}

func (r *relationalDatabaseClientImpl) PersistSDCommandInvocation(sdCommandInvocation *dllModel.SDCommandInvocation) sharedUtils.Result[uint32] {
	r.mu.Lock()
	defer r.mu.Unlock()
	entity := dll2db.ToDBModelEntitySDCommandInvocation(*sdCommandInvocation)
	if err := dbUtil.PersistEntityIntoDB(r.db, &entity); err != nil {
		return sharedUtils.NewFailureResult[uint32](err)
	}
	return sharedUtils.NewSuccessResult[uint32](entity.ID)
}

func (r *relationalDatabaseClientImpl) InvokeCommand(id uint32) sharedUtils.Result[bool] {
	r.mu.Lock()
	defer r.mu.Unlock()
	commandResult := dbUtil.LoadEntityFromDB[dbModel.SDCommandInvocationEntity](r.db, dbUtil.Where("id = ?", id))
	if commandResult.IsFailure() {
		return sharedUtils.NewFailureResult[bool](commandResult.GetError())
	}
	fmt.Printf("Invoking command with ID: %d\n", id)
	return sharedUtils.NewSuccessResult[bool](true)
}

func (r *relationalDatabaseClientImpl) CreateSDCommand(sdCommand dllModel.SDCommand) sharedUtils.Result[uint32] {
	r.mu.Lock()
	defer r.mu.Unlock()
	entity := dll2db.ToDBModelEntitySDCommand(sdCommand)
	if err := dbUtil.PersistEntityIntoDB(r.db, &entity); err != nil {
		return sharedUtils.NewFailureResult[uint32](err)
	}
	return sharedUtils.NewSuccessResult[uint32](entity.ID)
}

func (r *relationalDatabaseClientImpl) LoadSDCommand(id uint32) sharedUtils.Result[dllModel.SDCommand] {
	r.mu.Lock()
	defer r.mu.Unlock()
	result := dbUtil.LoadEntityFromDB[dbModel.SDCommandEntity](r.db, dbUtil.Where("id = ?", id))
	if result.IsFailure() {
		return sharedUtils.NewFailureResult[dllModel.SDCommand](result.GetError())
	}
	return sharedUtils.NewSuccessResult[dllModel.SDCommand](db2dll.ToDLLModelSDCommand(result.GetPayload()))
}

func (r *relationalDatabaseClientImpl) PersistSDCommand(sdCommand dllModel.SDCommand) sharedUtils.Result[uint32] {
	r.mu.Lock()
	defer r.mu.Unlock()
	entity := dll2db.ToDBModelEntitySDCommand(sdCommand)
	// Search for an existing command with the same name for the device type
	var existingEntity dbModel.SDCommandEntity
	err := r.db.
		Where("denotation = ? AND sd_type_id = ?", entity.Name, entity.SDTypeID).
		First(&existingEntity).Error
	if err == nil {
		// The record exists - overriding the ID, this makes Save() become UPDATE
		entity.ID = existingEntity.ID
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return sharedUtils.NewFailureResult[uint32](err)
	}
	// Persist (insert or update according to ID settings)
	if err := dbUtil.PersistEntityIntoDB(r.db, &entity); err != nil {
		return sharedUtils.NewFailureResult[uint32](err)
	}
	return sharedUtils.NewSuccessResult[uint32](entity.ID)
}

func (r *relationalDatabaseClientImpl) DeleteSDCommand(id uint32) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	return dbUtil.DeleteCertainEntityBasedOnId[dbModel.SDCommandEntity](r.db, id)
}

func (r *relationalDatabaseClientImpl) LoadSDCommands() sharedUtils.Result[[]dllModel.SDCommand] {
	r.mu.Lock()
	defer r.mu.Unlock()
	result := dbUtil.LoadEntitiesFromDB[dbModel.SDCommandEntity](r.db)
	if result.IsFailure() {
		return sharedUtils.NewFailureResult[[]dllModel.SDCommand](result.GetError())
	}
	return sharedUtils.NewSuccessResult(sharedUtils.Map(result.GetPayload(), db2dll.ToDLLModelSDCommand))
}

func (r *relationalDatabaseClientImpl) setup() {
	rawPostgresURL := sharedUtils.GetEnvironmentVariableValue("POSTGRES_URL").GetPayloadOrDefault("postgres://admin:password@postgres:5432/postgres-db")
	var db *gorm.DB
	var err error
	for {
		db, err = gorm.Open(postgres.Open(rawPostgresURL), new(gorm.Config))
		if err != nil && strings.Contains(err.Error(), "SQLSTATE 57P03") {
			fmt.Println("[RDB client (GORM)]: Database seems to be starting up, retrying connection in 5 seconds...")
			time.Sleep(time.Second * 5)
			continue
		}
		sharedUtils.TerminateOnError(err, "[RDB client (GORM)]: couldn't connect to the database")
		break
	}
	session := new(gorm.Session)
	session.Logger = logger.Default.LogMode(logger.Warn)
	r.db = db.Session(session)
	sharedUtils.TerminateOnError(r.db.AutoMigrate(
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
		new(dbModel.SDInstanceKPIDefinitionRelationshipEntity),
		new(dbModel.UserEntity),
		new(dbModel.SDCommandEntity),
		new(dbModel.SDCommandInvocationEntity),
		new(dbModel.UserEntity),
		new(dbModel.UserSessionEntity),
		new(dbModel.UserConfigEntity),
		new(dbModel.VPLProgramsEntity),
		new(dbModel.SDParameterSnapshotEntity),
		new(dbModel.VPLProgramsEntity),
		new(dbModel.VPLProgramSDSnapshotLinkEntity),
		new(dbModel.VPLProceduresEntity),
		new(dbModel.VPLProgramProcedureLinkEntity),
	), "[RDB client (GORM)]: auto-migration failed")
}

func (r *relationalDatabaseClientImpl) PersistKPIDefinition(kpiDefinition sharedModel.KPIDefinition) sharedUtils.Result[uint32] {
	r.mu.Lock()
	defer r.mu.Unlock()
	kpiDefinitionID := sharedUtils.NewOptionalFromPointer(kpiDefinition.ID).GetPayloadOrDefault(0)
	idsOfKPINodeEntitiesFormingTheKPIDefinition := sharedUtils.EmptySlice[uint32]()
	if kpiDefinitionID != 0 {
		getIDsOfKPINodeEntitiesFormingTheKPIDefinitionResult := dbModel.GetIDsOfKPINodeEntitiesFormingTheKPIDefinition(r.db, kpiDefinitionID)
		if getIDsOfKPINodeEntitiesFormingTheKPIDefinitionResult.IsFailure() {
			return sharedUtils.NewFailureResult[uint32](getIDsOfKPINodeEntitiesFormingTheKPIDefinitionResult.GetError())
		}
		idsOfKPINodeEntitiesFormingTheKPIDefinition = getIDsOfKPINodeEntitiesFormingTheKPIDefinitionResult.GetPayload()
	}
	kpiNodeEntity, kpiNodeEntities, logicalOperationNodeEntities, atomNodeEntities := dll2db.ToDBModelEntitiesKPIDefinition(kpiDefinition)
	referencedSDInstancesLoadResult := dbUtil.LoadEntitiesFromDB[dbModel.SDInstanceEntity](r.db, dbUtil.Where("uid IN (?)", kpiDefinition.SelectedSDInstanceUIDs))
	if referencedSDInstancesLoadResult.IsFailure() {
		return sharedUtils.NewFailureResult[uint32](referencedSDInstancesLoadResult.GetError())
	}
	referencedSDInstances := referencedSDInstancesLoadResult.GetPayload()
	kpiDefinitionEntity := dbModel.KPIDefinitionEntity{
		ID:             kpiDefinitionID,
		SDTypeID:       kpiDefinition.SDTypeID,
		UserIdentifier: kpiDefinition.UserIdentifier,
		RootNode:       kpiNodeEntity,
		SDInstanceMode: string(kpiDefinition.SDInstanceMode),
	}
	if err := r.db.Transaction(func(tx *gorm.DB) error {
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
	}); err != nil {
		return sharedUtils.NewFailureResult[uint32](err)
	}
	sdInstanceKPIDefinitionRelationshipEntities := sharedUtils.Map(referencedSDInstances, func(sdInstanceEntity dbModel.SDInstanceEntity) dbModel.SDInstanceKPIDefinitionRelationshipEntity {
		return dbModel.SDInstanceKPIDefinitionRelationshipEntity{
			KPIDefinitionID: kpiDefinitionEntity.ID,
			SDInstanceID:    sdInstanceEntity.ID,
			SDInstanceUID:   sdInstanceEntity.UID,
		}
	})
	// FIXME: No good reason to put this outside the main transaction... apart from foreign key integrity issues...
	if err := r.db.Transaction(func(tx *gorm.DB) error {
		for _, entity := range sdInstanceKPIDefinitionRelationshipEntities {
			if err := dbUtil.PersistEntityIntoDB[dbModel.SDInstanceKPIDefinitionRelationshipEntity](tx, &entity); err != nil {
				return err
			}
		}
		return nil
	}); err != nil {
		return sharedUtils.NewFailureResult[uint32](err)
	}
	if err := dbUtil.DeleteEntitiesBasedOnSliceOfIds[dbModel.KPINodeEntity](r.db, idsOfKPINodeEntitiesFormingTheKPIDefinition); err != nil {
		log.Printf("Warning: Best-effort cleanup operation (deleting redundant KPI node records after KPI definition update) failed: %s\n", err.Error())
	}
	return sharedUtils.NewSuccessResult[uint32](kpiDefinitionEntity.ID)
}

func (r *relationalDatabaseClientImpl) LoadKPIDefinition(id uint32) sharedUtils.Result[sharedModel.KPIDefinition] {
	r.mu.Lock()
	defer r.mu.Unlock()
	// TODO: Implement
	return sharedUtils.NewFailureResult[sharedModel.KPIDefinition](errors.New("[RDB client (GORM)]: not implemented"))
}

func (r *relationalDatabaseClientImpl) LoadKPIDefinitions() sharedUtils.Result[[]sharedModel.KPIDefinition] {
	r.mu.Lock()
	defer r.mu.Unlock()
	kpiDefinitionEntitiesLoadResult := dbUtil.LoadEntitiesFromDB[dbModel.KPIDefinitionEntity](r.db, dbUtil.Preload("SDType", "SDInstanceKPIDefinitionRelationshipRecords"))
	if kpiDefinitionEntitiesLoadResult.IsFailure() {
		err := fmt.Errorf("failed to load KPI definition entities from the database: %w", kpiDefinitionEntitiesLoadResult.GetError())
		return sharedUtils.NewFailureResult[[]sharedModel.KPIDefinition](err)
	}
	kpiDefinitionEntities := kpiDefinitionEntitiesLoadResult.GetPayload()
	kpiNodeEntitiesLoadResult := dbUtil.LoadEntitiesFromDB[dbModel.KPINodeEntity](r.db)
	if kpiNodeEntitiesLoadResult.IsFailure() {
		err := fmt.Errorf("failed to load KPI node entities from the database: %w", kpiNodeEntitiesLoadResult.GetError())
		return sharedUtils.NewFailureResult[[]sharedModel.KPIDefinition](err)
	}
	kpiNodeEntities := kpiNodeEntitiesLoadResult.GetPayload()
	logicalOperationKPINodeEntitiesLoadResult := dbUtil.LoadEntitiesFromDB[dbModel.LogicalOperationKPINodeEntity](r.db)
	if logicalOperationKPINodeEntitiesLoadResult.IsFailure() {
		err := fmt.Errorf("failed to load logical operation KPI node entities from the database: %w", logicalOperationKPINodeEntitiesLoadResult.GetError())
		return sharedUtils.NewFailureResult[[]sharedModel.KPIDefinition](err)
	}
	logicalOperationKPINodeEntities := logicalOperationKPINodeEntitiesLoadResult.GetPayload()
	atomKPINodeEntitiesLoadResult := dbUtil.LoadEntitiesFromDB[dbModel.AtomKPINodeEntity](r.db, dbUtil.Preload("SDParameter"))
	if atomKPINodeEntitiesLoadResult.IsFailure() {
		err := fmt.Errorf("failed to load atom KPI node entities from the database: %w", atomKPINodeEntitiesLoadResult.GetError())
		return sharedUtils.NewFailureResult[[]sharedModel.KPIDefinition](err)
	}
	atomKPINodeEntities := atomKPINodeEntitiesLoadResult.GetPayload()
	kpiDefinitions := make([]sharedModel.KPIDefinition, 0, len(kpiDefinitionEntities))
	sharedUtils.ForEach(kpiDefinitionEntities, func(kpiDefinitionEntity dbModel.KPIDefinitionEntity) {
		kpiDefinition := db2dll.ToDLLModelKPIDefinition(kpiDefinitionEntity, kpiNodeEntities, logicalOperationKPINodeEntities, atomKPINodeEntities)
		kpiDefinitions = append(kpiDefinitions, kpiDefinition)
	})
	return sharedUtils.NewSuccessResult[[]sharedModel.KPIDefinition](kpiDefinitions)
}

func (r *relationalDatabaseClientImpl) DeleteKPIDefinition(id uint32) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	idsOfKPINodeEntitiesFormingTheDefinitionResult := dbModel.GetIDsOfKPINodeEntitiesFormingTheKPIDefinition(r.db, id)
	if idsOfKPINodeEntitiesFormingTheDefinitionResult.IsFailure() {
		return idsOfKPINodeEntitiesFormingTheDefinitionResult.GetError()
	}
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := dbUtil.DeleteCertainEntityBasedOnId[dbModel.KPIDefinitionEntity](tx, id); err != nil {
			return err
		}
		if err := dbUtil.DeleteEntitiesBasedOnSliceOfIds[dbModel.KPINodeEntity](tx, idsOfKPINodeEntitiesFormingTheDefinitionResult.GetPayload()); err != nil {
			return err
		}
		return nil
	})
}

func (r *relationalDatabaseClientImpl) PersistSDType(sdType dllModel.SDType) sharedUtils.Result[dllModel.SDType] {
	r.mu.Lock()
	defer r.mu.Unlock()

	// DB conversion
	sdTypeEntity := dll2db.ToDBModelEntitySDType(sdType)

	// Is a specified sdtype exist?
	var existingEntity dbModel.SDTypeEntity
	result := r.db.Preload("Commands").Preload("Parameters").Where("denotation = ?", sdTypeEntity.Denotation).First(&existingEntity)

	if result.Error == nil {
		// If it exists, take the ID and merge Commands + Parameters
		sdTypeEntity.ID = existingEntity.ID

		// === MERGE COMMANDS ===
		existingCommands := make(map[string]dbModel.SDCommandEntity)
		for _, cmd := range existingEntity.Commands {
			existingCommands[cmd.Name] = cmd
		}

		mergedCommands := make([]dbModel.SDCommandEntity, 0)
		for _, newCmd := range sdTypeEntity.Commands {
			if existingCmd, found := existingCommands[newCmd.Name]; found {
				newCmd.ID = existingCmd.ID // Update
			}
			newCmd.SDTypeID = sdTypeEntity.ID
			mergedCommands = append(mergedCommands, newCmd)
		}
		sdTypeEntity.Commands = mergedCommands

		// === MERGE PARAMETERS ===
		existingParams := make(map[string]dbModel.SDParameterEntity)
		for _, param := range existingEntity.Parameters {
			existingParams[param.Denotation] = param
		}

		mergedParams := make([]dbModel.SDParameterEntity, 0)
		for _, newParam := range sdTypeEntity.Parameters {
			if existingParam, found := existingParams[newParam.Denotation]; found {
				newParam.ID = existingParam.ID // Update
			}
			newParam.SDTypeID = sdTypeEntity.ID
			mergedParams = append(mergedParams, newParam)
		}
		sdTypeEntity.Parameters = mergedParams

	} else if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return sharedUtils.NewFailureResult[dllModel.SDType](result.Error)
	}

	if err := dbUtil.PersistEntityIntoDB[dbModel.SDTypeEntity](r.db, &sdTypeEntity); err != nil {
		return sharedUtils.NewFailureResult[dllModel.SDType](err)
	}

	return sharedUtils.NewSuccessResult[dllModel.SDType](db2dll.ToDLLModelSDType(sdTypeEntity))
}

func loadSDType(g *gorm.DB, whereClause dbUtil.WhereClause) sharedUtils.Result[dllModel.SDType] {
	sdTypeEntityLoadResult := dbUtil.LoadEntityFromDB[dbModel.SDTypeEntity](g,
		dbUtil.Preload("Parameters"),
		dbUtil.Preload("Parameters.SDParameterSnapshot"),
		dbUtil.Preload("Commands"),
		whereClause,
	)
	if sdTypeEntityLoadResult.IsFailure() {
		return sharedUtils.NewFailureResult[dllModel.SDType](sdTypeEntityLoadResult.GetError())
	}
	return sharedUtils.NewSuccessResult[dllModel.SDType](db2dll.ToDLLModelSDType(sdTypeEntityLoadResult.GetPayload()))
}

func (r *relationalDatabaseClientImpl) LoadSDType(id uint32) sharedUtils.Result[dllModel.SDType] {
	r.mu.Lock()
	defer r.mu.Unlock()
	return loadSDType(r.db, dbUtil.Where("id = ?", id))
}

func (r *relationalDatabaseClientImpl) LoadSDTypeBasedOnDenotation(denotation string) sharedUtils.Result[dllModel.SDType] {
	r.mu.Lock()
	defer r.mu.Unlock()
	return loadSDType(r.db, dbUtil.Where("denotation = ?", denotation))
}

func (r *relationalDatabaseClientImpl) LoadSDTypes() sharedUtils.Result[[]dllModel.SDType] {
	r.mu.Lock()
	defer r.mu.Unlock()
	sdTypeEntitiesLoadResult := dbUtil.LoadEntitiesFromDB[dbModel.SDTypeEntity](r.db,
		dbUtil.Preload("Parameters"),
		dbUtil.Preload("Parameters.SDParameterSnapshot"),
	)
	if sdTypeEntitiesLoadResult.IsFailure() {
		return sharedUtils.NewFailureResult[[]dllModel.SDType](sdTypeEntitiesLoadResult.GetError())
	}
	return sharedUtils.NewSuccessResult[[]dllModel.SDType](sharedUtils.Map(sdTypeEntitiesLoadResult.GetPayload(), db2dll.ToDLLModelSDType))
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
			rootNodeID := sharedUtils.NewOptionalFromPointer(relatedKPIDefinitionEntity.RootNodeID).GetPayload()
			if err := dbUtil.DeleteCertainEntityBasedOnId[dbModel.KPINodeEntity](tx, rootNodeID); err != nil {
				return fmt.Errorf("failed to delete KPI node entity with ID = %d from the database: %w", rootNodeID, err)
			}
		}
		return nil
	})
}

func (r *relationalDatabaseClientImpl) PersistSDInstance(sdInstance dllModel.SDInstance) sharedUtils.Result[uint32] {
	r.mu.Lock()
	defer r.mu.Unlock()
	sdInstanceEntity := dll2db.ToDBModelEntitySDInstance(sdInstance)
	if err := dbUtil.PersistEntityIntoDB(r.db, &sdInstanceEntity); err != nil {
		return sharedUtils.NewFailureResult[uint32](err)
	}
	return sharedUtils.NewSuccessResult[uint32](sdInstanceEntity.ID)
}

func (r *relationalDatabaseClientImpl) PersistNewSDInstance(uid string, sdTypeSpecification string) sharedUtils.Result[dllModel.SDInstance] {
	r.mu.Lock()
	defer r.mu.Unlock()
	sdInstanceEntityLoadResult := dbUtil.LoadEntityFromDB[dbModel.SDInstanceEntity](r.db, dbUtil.Where("uid = ?", uid))
	if sdInstanceEntityLoadResult.IsSuccess() {
		return sharedUtils.NewSuccessResult(db2dll.ToDLLModelSDInstance(sdInstanceEntityLoadResult.GetPayload()))
	} else if sdInstanceEntityLoadError := sdInstanceEntityLoadResult.GetError(); !errors.Is(sdInstanceEntityLoadError, gorm.ErrRecordNotFound) {
		return sharedUtils.NewFailureResult[dllModel.SDInstance](sdInstanceEntityLoadError)
	}
	referencedSDTypeEntityLoadResult := dbUtil.LoadEntityFromDB[dbModel.SDTypeEntity](r.db, dbUtil.Where("denotation = ?", sdTypeSpecification))
	if referencedSDTypeEntityLoadResult.IsFailure() {
		referencedSDTypeEntityLoadError := referencedSDTypeEntityLoadResult.GetError()
		err := sharedUtils.Ternary(errors.Is(referencedSDTypeEntityLoadError, gorm.ErrRecordNotFound), ErrOperationWouldLeadToForeignKeyIntegrityBreach, referencedSDTypeEntityLoadError)
		return sharedUtils.NewFailureResult[dllModel.SDInstance](err)
	}
	sdInstanceEntity := dbModel.SDInstanceEntity{
		UID:             uid,
		ConfirmedByUser: false,
		UserIdentifier:  uid,
		SDTypeID:        referencedSDTypeEntityLoadResult.GetPayload().ID,
	}
	if err := dbUtil.PersistEntityIntoDB(r.db, &sdInstanceEntity); err != nil {
		return sharedUtils.NewFailureResult[dllModel.SDInstance](err)
	}
	return sharedUtils.NewSuccessResult[dllModel.SDInstance](db2dll.ToDLLModelSDInstance(sdInstanceEntity))
}

func (r *relationalDatabaseClientImpl) LoadSDInstance(id uint32) sharedUtils.Result[dllModel.SDInstance] {
	r.mu.Lock()
	defer r.mu.Unlock()
	sdInstanceEntityLoadResult := dbUtil.LoadEntityFromDB[dbModel.SDInstanceEntity](
		r.db,
		dbUtil.Preload("SDType"),
		dbUtil.Preload("SDType.Parameters"),
		dbUtil.Preload("SDParameterSnapshot"),
		dbUtil.Where("id = ?", id),
	)
	if sdInstanceEntityLoadResult.IsFailure() {
		return sharedUtils.NewFailureResult[dllModel.SDInstance](sdInstanceEntityLoadResult.GetError())
	}
	return sharedUtils.NewSuccessResult[dllModel.SDInstance](db2dll.ToDLLModelSDInstance(sdInstanceEntityLoadResult.GetPayload()))
}

func (r *relationalDatabaseClientImpl) LoadSDInstanceBasedOnUID(uid string) sharedUtils.Result[sharedUtils.Optional[dllModel.SDInstance]] {
	r.mu.Lock()
	defer r.mu.Unlock()
	sdInstanceEntityLoadResult := dbUtil.LoadEntityFromDB[dbModel.SDInstanceEntity](r.db,
		dbUtil.Preload("SDType"),
		dbUtil.Preload("SDType.Parameters"),
		dbUtil.Preload("SDType.Commands"),
		dbUtil.Preload("SDParameterSnapshot"),
		dbUtil.Where("uid = ?", uid),
	)
	if sdInstanceEntityLoadResult.IsFailure() {
		err := sdInstanceEntityLoadResult.GetError()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return sharedUtils.NewSuccessResult[sharedUtils.Optional[dllModel.SDInstance]](sharedUtils.NewEmptyOptional[dllModel.SDInstance]())
		} else {
			return sharedUtils.NewFailureResult[sharedUtils.Optional[dllModel.SDInstance]](err)
		}
	}
	return sharedUtils.NewSuccessResult[sharedUtils.Optional[dllModel.SDInstance]](sharedUtils.NewOptionalOf(db2dll.ToDLLModelSDInstance(sdInstanceEntityLoadResult.GetPayload())))
}

func (r *relationalDatabaseClientImpl) LoadSDInstances() sharedUtils.Result[[]dllModel.SDInstance] {
	r.mu.Lock()
	defer r.mu.Unlock()
	sdInstanceEntitiesLoadResult := dbUtil.LoadEntitiesFromDB[dbModel.SDInstanceEntity](
		r.db,
		dbUtil.Preload("SDType"),
		dbUtil.Preload("SDType.Parameters"),
		dbUtil.Preload("SDType.Commands"),
		dbUtil.Preload("SDParameterSnapshot"),
	)
	if sdInstanceEntitiesLoadResult.IsFailure() {
		return sharedUtils.NewFailureResult[[]dllModel.SDInstance](sdInstanceEntitiesLoadResult.GetError())
	}
	return sharedUtils.NewSuccessResult[[]dllModel.SDInstance](sharedUtils.Map(sdInstanceEntitiesLoadResult.GetPayload(), db2dll.ToDLLModelSDInstance))
}

func (r *relationalDatabaseClientImpl) PersistKPIFulFulfillmentCheckResultTuple(sdInstanceUID string, kpiDefinitionIDs []uint32, fulfillmentStatuses []bool) sharedUtils.Result[[]dllModel.KPIFulfillmentCheckResult] {
	r.mu.Lock()
	defer r.mu.Unlock()
	referencedKPIDefinitionEntitiesExistCheckResult := dbUtil.DoIDsExist[dbModel.KPIDefinitionEntity](r.db, kpiDefinitionIDs)
	if referencedKPIDefinitionEntitiesExistCheckResult.IsFailure() {
		return sharedUtils.NewFailureResult[[]dllModel.KPIFulfillmentCheckResult](referencedKPIDefinitionEntitiesExistCheckResult.GetError())
	}
	if referencedKPIDefinitionEntitiesExist := referencedKPIDefinitionEntitiesExistCheckResult.GetPayload(); !referencedKPIDefinitionEntitiesExist {
		return sharedUtils.NewFailureResult[[]dllModel.KPIFulfillmentCheckResult](ErrOperationWouldLeadToForeignKeyIntegrityBreach)
	}
	referencedSDInstanceEntityLoadResult := dbUtil.LoadEntityFromDB[dbModel.SDInstanceEntity](r.db, dbUtil.Where("uid = ?", sdInstanceUID))
	if referencedSDInstanceEntityLoadResult.IsFailure() {
		referencedSDInstanceEntityLoadError := referencedSDInstanceEntityLoadResult.GetError()
		err := sharedUtils.Ternary(errors.Is(referencedSDInstanceEntityLoadError, gorm.ErrRecordNotFound), ErrOperationWouldLeadToForeignKeyIntegrityBreach, referencedSDInstanceEntityLoadError)
		return sharedUtils.NewFailureResult[[]dllModel.KPIFulfillmentCheckResult](err)
	}
	referencedSDInstanceEntityID := referencedSDInstanceEntityLoadResult.GetPayload().ID
	kpiFulfillmentCheckResultEntities := make([]dbModel.KPIFulfillmentCheckResultEntity, 0)
	err := r.db.Transaction(func(tx *gorm.DB) error {
		for index, kpiDefinitionID := range kpiDefinitionIDs {
			kpiFulfillmentCheckResultEntity := dbModel.KPIFulfillmentCheckResultEntity{
				KPIDefinitionID: kpiDefinitionID,
				SDInstanceID:    referencedSDInstanceEntityID,
				Fulfilled:       fulfillmentStatuses[index],
			}
			if err := dbUtil.PersistEntityIntoDB(r.db, &kpiFulfillmentCheckResultEntity); err != nil {
				return err
			}
			kpiFulfillmentCheckResultEntities = append(kpiFulfillmentCheckResultEntities, kpiFulfillmentCheckResultEntity)
		}
		return nil
	})
	if err != nil {
		return sharedUtils.NewFailureResult[[]dllModel.KPIFulfillmentCheckResult](err)
	}
	return sharedUtils.NewSuccessResult(sharedUtils.Map(kpiFulfillmentCheckResultEntities, db2dll.ToDLLModelKPIFulfillmentCheckResult))
}

func (r *relationalDatabaseClientImpl) LoadKPIFulFulfillmentCheckResult(kpiDefinitionID uint32, sdInstanceID uint32) sharedUtils.Result[sharedUtils.Optional[dllModel.KPIFulfillmentCheckResult]] {
	r.mu.Lock()
	defer r.mu.Unlock()
	kpiFulFulfillmentCheckResultEntityLoadResult := dbUtil.LoadEntityFromDB[dbModel.KPIFulfillmentCheckResultEntity](r.db, dbUtil.Where("kpi_definition_id = ?", kpiDefinitionID), dbUtil.Where("sd_instance_id = ?", sdInstanceID))
	if kpiFulFulfillmentCheckResultEntityLoadResult.IsFailure() {
		err := kpiFulFulfillmentCheckResultEntityLoadResult.GetError()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return sharedUtils.NewSuccessResult[sharedUtils.Optional[dllModel.KPIFulfillmentCheckResult]](sharedUtils.NewEmptyOptional[dllModel.KPIFulfillmentCheckResult]())
		} else {
			return sharedUtils.NewFailureResult[sharedUtils.Optional[dllModel.KPIFulfillmentCheckResult]](err)
		}
	}
	return sharedUtils.NewSuccessResult[sharedUtils.Optional[dllModel.KPIFulfillmentCheckResult]](sharedUtils.NewOptionalOf(db2dll.ToDLLModelKPIFulfillmentCheckResult(kpiFulFulfillmentCheckResultEntityLoadResult.GetPayload())))
}

func (r *relationalDatabaseClientImpl) LoadKPIFulFulfillmentCheckResults() sharedUtils.Result[[]dllModel.KPIFulfillmentCheckResult] {
	r.mu.Lock()
	defer r.mu.Unlock()
	kpiFulFulfillmentCheckResultEntitiesLoadResult := dbUtil.LoadEntitiesFromDB[dbModel.KPIFulfillmentCheckResultEntity](r.db)
	if kpiFulFulfillmentCheckResultEntitiesLoadResult.IsFailure() {
		return sharedUtils.NewFailureResult[[]dllModel.KPIFulfillmentCheckResult](kpiFulFulfillmentCheckResultEntitiesLoadResult.GetError())
	}
	return sharedUtils.NewSuccessResult[[]dllModel.KPIFulfillmentCheckResult](sharedUtils.Map(kpiFulFulfillmentCheckResultEntitiesLoadResult.GetPayload(), db2dll.ToDLLModelKPIFulfillmentCheckResult))
}

func (r *relationalDatabaseClientImpl) LoadSDInstanceGroups() sharedUtils.Result[[]dllModel.SDInstanceGroup] {
	r.mu.Lock()
	defer r.mu.Unlock()
	sdInstanceGroupEntitiesLoadResult := dbUtil.LoadEntitiesFromDB[dbModel.SDInstanceGroupEntity](r.db, dbUtil.Preload("GroupMembershipRecords"))
	if sdInstanceGroupEntitiesLoadResult.IsFailure() {
		return sharedUtils.NewFailureResult[[]dllModel.SDInstanceGroup](sdInstanceGroupEntitiesLoadResult.GetError())
	}
	return sharedUtils.NewSuccessResult(sharedUtils.Map(sdInstanceGroupEntitiesLoadResult.GetPayload(), db2dll.ToDLLModelSDInstanceGroup))
}

func (r *relationalDatabaseClientImpl) LoadSDInstanceGroup(id uint32) sharedUtils.Result[dllModel.SDInstanceGroup] {
	r.mu.Lock()
	defer r.mu.Unlock()
	sdInstanceGroupEntityLoadResult := dbUtil.LoadEntityFromDB[dbModel.SDInstanceGroupEntity](r.db, dbUtil.Preload("GroupMembershipRecords"), dbUtil.Where("id = ?", id))
	if sdInstanceGroupEntityLoadResult.IsFailure() {
		return sharedUtils.NewFailureResult[dllModel.SDInstanceGroup](sdInstanceGroupEntityLoadResult.GetError())
	}
	return sharedUtils.NewSuccessResult(db2dll.ToDLLModelSDInstanceGroup(sdInstanceGroupEntityLoadResult.GetPayload()))
}

func (r *relationalDatabaseClientImpl) PersistSDInstanceGroup(sdInstanceGroup dllModel.SDInstanceGroup) sharedUtils.Result[uint32] {
	r.mu.Lock()
	defer r.mu.Unlock()
	sdInstanceGroupEntity := dll2db.ToDBModelEntitySDInstanceGroup(sdInstanceGroup)
	if err := dbUtil.PersistEntityIntoDB(r.db, &sdInstanceGroupEntity); err != nil {
		return sharedUtils.NewFailureResult[uint32](err)
	}
	return sharedUtils.NewSuccessResult[uint32](sdInstanceGroupEntity.ID)
}

func (r *relationalDatabaseClientImpl) DeleteSDInstanceGroup(id uint32) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	return dbUtil.DeleteCertainEntityBasedOnId[dbModel.SDInstanceGroupEntity](r.db, id)
}

func (r *relationalDatabaseClientImpl) PersistUser(user dllModel.User) sharedUtils.Result[uint] {
	r.mu.Lock()
	defer r.mu.Unlock()
	userEntity := dll2db.ToDBModelEntityUser(user)
	if err := dbUtil.PersistEntityIntoDB(r.db, &userEntity); err != nil {
		return sharedUtils.NewFailureResult[uint](err)
	}
	return sharedUtils.NewSuccessResult[uint](userEntity.Model.ID)
}

func (r *relationalDatabaseClientImpl) LoadUserBasedOnOAuth2ProviderIssuedID(oauth2ProviderIssuedID string) sharedUtils.Result[sharedUtils.Optional[dllModel.User]] {
	r.mu.Lock()
	defer r.mu.Unlock()
	userEntityLoadResult := dbUtil.LoadEntityFromDB[dbModel.UserEntity](r.db, dbUtil.Where("oauth2_provider_issued_id = ?", oauth2ProviderIssuedID))
	if userEntityLoadResult.IsFailure() {
		userEntityLoadError := userEntityLoadResult.GetError()
		if errors.Is(userEntityLoadError, gorm.ErrRecordNotFound) {
			return sharedUtils.NewSuccessResult[sharedUtils.Optional[dllModel.User]](sharedUtils.NewEmptyOptional[dllModel.User]())
		} else {
			return sharedUtils.NewFailureResult[sharedUtils.Optional[dllModel.User]](userEntityLoadError)
		}
	}
	return sharedUtils.NewSuccessResult[sharedUtils.Optional[dllModel.User]](sharedUtils.NewOptionalOf(db2dll.ToDLLModelUser(userEntityLoadResult.GetPayload())))
}

func (r *relationalDatabaseClientImpl) LoadUser(id uint) sharedUtils.Result[dllModel.User] {
	r.mu.Lock()
	defer r.mu.Unlock()
	// TODO: Implement
	return sharedUtils.NewFailureResult[dllModel.User](errors.New("[RDB client (GORM)]: not implemented"))
}

func (r *relationalDatabaseClientImpl) LoadUserSessionBasedOnRefreshTokenHash(refreshTokenHash string) sharedUtils.Result[sharedUtils.Optional[dllModel.UserSession]] {
	r.mu.Lock()
	defer r.mu.Unlock()
	userSessionEntityLoadResult := dbUtil.LoadEntityFromDB[dbModel.UserSessionEntity](r.db, dbUtil.Where("refresh_token_hash = ?", refreshTokenHash))
	if userSessionEntityLoadResult.IsFailure() {
		userSessionEntityLoadError := userSessionEntityLoadResult.GetError()
		if errors.Is(userSessionEntityLoadError, gorm.ErrRecordNotFound) {
			return sharedUtils.NewSuccessResult[sharedUtils.Optional[dllModel.UserSession]](sharedUtils.NewEmptyOptional[dllModel.UserSession]())
		} else {
			return sharedUtils.NewFailureResult[sharedUtils.Optional[dllModel.UserSession]](userSessionEntityLoadError)
		}
	}
	return sharedUtils.NewSuccessResult[sharedUtils.Optional[dllModel.UserSession]](sharedUtils.NewOptionalOf(db2dll.ToDLLModelUserSession(userSessionEntityLoadResult.GetPayload())))
}

func (r *relationalDatabaseClientImpl) PersistUserSession(userSession dllModel.UserSession) sharedUtils.Result[uint] {
	r.mu.Lock()
	defer r.mu.Unlock()
	userSessionEntity := dll2db.ToDBModelEntityUserSession(userSession)
	if err := dbUtil.PersistEntityIntoDB(r.db, &userSessionEntity); err != nil {
		return sharedUtils.NewFailureResult[uint](err)
	}
	return sharedUtils.NewSuccessResult[uint](userSessionEntity.ID)
}

func (r *relationalDatabaseClientImpl) PersistUserConfig(userConfig dllModel.UserConfig) sharedUtils.Result[uint32] {
	r.mu.Lock()
	defer r.mu.Unlock()

	userConfigEntity := dll2db.ToDBModelEntityUserConfig(userConfig)

	if err := dbUtil.PersistEntityIntoDB(r.db, &userConfigEntity); err != nil {
		return sharedUtils.NewFailureResult[uint32](err)
	}

	return sharedUtils.NewSuccessResult[uint32](userConfigEntity.UserID)
}

func (r *relationalDatabaseClientImpl) LoadUserConfig(userId uint32) sharedUtils.Result[dllModel.UserConfig] {
	r.mu.Lock()
	defer r.mu.Unlock()

	userConfigEntityLoadResult := dbUtil.LoadEntityFromDB[dbModel.UserConfigEntity](r.db, dbUtil.Where("user_id = ?", userId))

	if userConfigEntityLoadResult.IsFailure() {
		return sharedUtils.NewFailureResult[dllModel.UserConfig](userConfigEntityLoadResult.GetError())
	}

	return sharedUtils.NewSuccessResult(db2dll.ToDLLModelUserConfig(userConfigEntityLoadResult.GetPayload()))
}

func (r *relationalDatabaseClientImpl) DeleteUserConfig(userId uint32) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	return dbUtil.DeleteCertainEntityBasedOnId[dbModel.UserConfigEntity](r.db, userId)
}

func (r *relationalDatabaseClientImpl) PersistSDParameterSnapshot(snapshot dllModel.SDParameterSnapshot) sharedUtils.Result[sharedUtils.Pair[uint32, uint32]] {
	r.mu.Lock()
	defer r.mu.Unlock()

	snapshotEntity := dll2db.ToDBModelEntitySDParameterSnapshot(snapshot, snapshot.SDInstance, snapshot.SDParameter)

	if err := dbUtil.PersistEntityIntoDB(r.db, &snapshotEntity); err != nil {
		return sharedUtils.NewFailureResult[sharedUtils.Pair[uint32, uint32]](err)
	}

	return sharedUtils.NewSuccessResult[sharedUtils.Pair[uint32, uint32]](sharedUtils.NewPairOf(snapshotEntity.SDParameterID, snapshotEntity.SDInstanceID))
}

func (r *relationalDatabaseClientImpl) PersistVPLProgram(vplProgram dllModel.VPLProgram) sharedUtils.Result[dllModel.VPLProgram] {
	r.mu.Lock()
	defer r.mu.Unlock()

	vplProgramEntityLoadResult := dbUtil.LoadEntityFromDB[dbModel.VPLProgramsEntity](r.db, dbUtil.Where("name = ?", vplProgram.Name))
	if vplProgramEntityLoadResult.IsSuccess() {
		return sharedUtils.NewFailureResult[dllModel.VPLProgram](errors.New("VPL program with the same name already exists"))
	}

	vplProgramEntity := dll2db.ToDBModelEntityVPLProgram(vplProgram)

	if err := dbUtil.PersistEntityIntoDB(r.db, &vplProgramEntity); err != nil {
		return sharedUtils.NewFailureResult[dllModel.VPLProgram](err)
	}

	return sharedUtils.NewSuccessResult[dllModel.VPLProgram](db2dll.ToDLLModelVplProgram(vplProgramEntity))
}

func (r *relationalDatabaseClientImpl) LoadVPLProgram(id uint32) sharedUtils.Result[dllModel.VPLProgram] {
	r.mu.Lock()
	defer r.mu.Unlock()

	vplProgramEntityLoadResult := dbUtil.LoadEntityFromDB[dbModel.VPLProgramsEntity](r.db, dbUtil.Where("id = ?", id), dbUtil.Preload("SDParameterSnapshots"))

	if vplProgramEntityLoadResult.IsFailure() {
		return sharedUtils.NewFailureResult[dllModel.VPLProgram](vplProgramEntityLoadResult.GetError())
	}

	return sharedUtils.NewSuccessResult(db2dll.ToDLLModelVplProgram(vplProgramEntityLoadResult.GetPayload()))
}

func (r *relationalDatabaseClientImpl) LoadVPLPrograms() sharedUtils.Result[[]dllModel.VPLProgram] {
	r.mu.Lock()
	defer r.mu.Unlock()

	vplProgramEntitiesLoadResult := dbUtil.LoadEntitiesFromDB[dbModel.VPLProgramsEntity](r.db, dbUtil.Preload("SDParameterSnapshots"))

	if vplProgramEntitiesLoadResult.IsFailure() {
		return sharedUtils.NewFailureResult[[]dllModel.VPLProgram](vplProgramEntitiesLoadResult.GetError())
	}

	return sharedUtils.NewSuccessResult(sharedUtils.Map(vplProgramEntitiesLoadResult.GetPayload(), db2dll.ToDLLModelVplProgram))
}

func (r *relationalDatabaseClientImpl) DeleteVPLProgram(id uint32) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	return dbUtil.DeleteCertainEntityBasedOnId[dbModel.VPLProgramsEntity](r.db, id)
}

func (r *relationalDatabaseClientImpl) PersistVPLProcedure(vplProcedure dllModel.VPLProcedure) sharedUtils.Result[dllModel.VPLProcedure] {
	r.mu.Lock()
	defer r.mu.Unlock()

	vplProcedureEntity := dll2db.ToDBModelEntityVPLProcedure(vplProcedure)

	if err := dbUtil.PersistEntityIntoDB(r.db, &vplProcedureEntity); err != nil {
		return sharedUtils.NewFailureResult[dllModel.VPLProcedure](err)
	}

	return sharedUtils.NewSuccessResult(db2dll.ToDLLModelVplProcedure(vplProcedureEntity))
}

func (r *relationalDatabaseClientImpl) LoadVPLProcedure(id uint32) sharedUtils.Result[dllModel.VPLProcedure] {
	r.mu.Lock()
	defer r.mu.Unlock()

	vplProcedureEntityLoadResult := dbUtil.LoadEntityFromDB[dbModel.VPLProceduresEntity](r.db, dbUtil.Where("id = ?", id))

	if vplProcedureEntityLoadResult.IsFailure() {
		return sharedUtils.NewFailureResult[dllModel.VPLProcedure](vplProcedureEntityLoadResult.GetError())
	}

	return sharedUtils.NewSuccessResult(db2dll.ToDLLModelVplProcedure(vplProcedureEntityLoadResult.GetPayload()))
}

func (r *relationalDatabaseClientImpl) LoadVPLProcedures() sharedUtils.Result[[]dllModel.VPLProcedure] {
	r.mu.Lock()
	defer r.mu.Unlock()

	vplProcedureEntitiesLoadResult := dbUtil.LoadEntitiesFromDB[dbModel.VPLProceduresEntity](r.db)

	if vplProcedureEntitiesLoadResult.IsFailure() {
		return sharedUtils.NewFailureResult[[]dllModel.VPLProcedure](vplProcedureEntitiesLoadResult.GetError())
	}

	return sharedUtils.NewSuccessResult(sharedUtils.Map(vplProcedureEntitiesLoadResult.GetPayload(), db2dll.ToDLLModelVplProcedure))
}

func (r *relationalDatabaseClientImpl) DeleteVPLProcedure(id uint32) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	return dbUtil.DeleteCertainEntityBasedOnId[dbModel.VPLProceduresEntity](r.db, id)
}

// LinkProgramToProcedure creates a link between a program and a procedure
func (r *relationalDatabaseClientImpl) LinkProgramToProcedure(programID uint32, procedureID uint32) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	// Check if program exists
	var program dbModel.VPLProgramsEntity
	if err := r.db.First(&program, programID).Error; err != nil {
		return fmt.Errorf("program with ID %d not found: %w", programID, err)
	}

	// Check if procedure exists
	var procedure dbModel.VPLProceduresEntity
	if err := r.db.First(&procedure, procedureID).Error; err != nil {
		return fmt.Errorf("procedure with ID %d not found: %w", procedureID, err)
	}

	// Check if link already exists
	var existingLink dbModel.VPLProgramProcedureLinkEntity
	result := r.db.Where("program_id = ? AND procedure_id = ?", programID, procedureID).First(&existingLink)
	if result.Error == nil {
		// Link already exists, nothing to do
		return nil
	} else if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
		// Some other error occurred
		return result.Error
	}

	// Create the link
	link := dbModel.VPLProgramProcedureLinkEntity{
		ProgramID:   programID,
		ProcedureID: procedureID,
	}

	if err := dbUtil.PersistEntityIntoDB(r.db, &link); err != nil {
		return err
	}

	return nil
}

// UnlinkProgramFromProcedure removes a link between a program and a procedure
func (r *relationalDatabaseClientImpl) UnlinkProgramFromProcedure(programID uint32, procedureID uint32) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	// Delete the link
	result := r.db.Where("program_id = ? AND procedure_id = ?", programID, procedureID).Delete(&dbModel.VPLProgramProcedureLinkEntity{})
	if result.Error != nil {
		return result.Error
	}

	return nil
}

// GetProceduresForProgram returns all procedures linked to a program
func (r *relationalDatabaseClientImpl) GetProceduresForProgram(programID uint32) sharedUtils.Result[[]dllModel.VPLProcedure] {
	r.mu.Lock()
	defer r.mu.Unlock()

	// Get all procedure IDs linked to the program
	var links []dbModel.VPLProgramProcedureLinkEntity
	if err := r.db.Where("program_id = ?", programID).Find(&links).Error; err != nil {
		return sharedUtils.NewFailureResult[[]dllModel.VPLProcedure](err)
	}

	// If no links found, return an empty slice
	if len(links) == 0 {
		return sharedUtils.NewSuccessResult([]dllModel.VPLProcedure{})
	}

	// Extract procedure IDs
	procedureIDs := make([]uint32, len(links))
	for i, link := range links {
		procedureIDs[i] = link.ProcedureID
	}

	// Get all procedures with the extracted IDs
	var procedures []dbModel.VPLProceduresEntity
	if err := r.db.Where("id IN ?", procedureIDs).Find(&procedures).Error; err != nil {
		return sharedUtils.NewFailureResult[[]dllModel.VPLProcedure](err)
	}

	// Convert to DLL model
	result := make([]dllModel.VPLProcedure, len(procedures))
	for i, procedure := range procedures {
		result[i] = db2dll.ToDLLModelVplProcedure(procedure)
	}

	return sharedUtils.NewSuccessResult(result)
}

// GetProgramsForProcedure returns all programs linked to a procedure
func (r *relationalDatabaseClientImpl) GetProgramsForProcedure(procedureID uint32) sharedUtils.Result[[]dllModel.VPLProgram] {
	r.mu.Lock()
	defer r.mu.Unlock()

	// Get all program IDs linked to the procedure
	var links []dbModel.VPLProgramProcedureLinkEntity
	if err := r.db.Where("procedure_id = ?", procedureID).Find(&links).Error; err != nil {
		return sharedUtils.NewFailureResult[[]dllModel.VPLProgram](err)
	}

	// If no links found, return an empty slice
	if len(links) == 0 {
		return sharedUtils.NewSuccessResult([]dllModel.VPLProgram{})
	}

	// Extract program IDs
	programIDs := make([]uint32, len(links))
	for i, link := range links {
		programIDs[i] = link.ProgramID
	}

	// Get all programs with the extracted IDs
	var programs []dbModel.VPLProgramsEntity
	if err := r.db.Where("id IN ?", programIDs).Find(&programs).Error; err != nil {
		return sharedUtils.NewFailureResult[[]dllModel.VPLProgram](err)
	}

	// Convert to DLL model
	result := make([]dllModel.VPLProgram, len(programs))
	for i, program := range programs {
		result[i] = db2dll.ToDLLModelVplProgram(program)
	}

	return sharedUtils.NewSuccessResult(result)
}
