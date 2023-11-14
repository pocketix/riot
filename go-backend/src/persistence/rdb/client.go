package rdb

import (
	"bp-bures-SfPDfSD/src/dto"
	"bp-bures-SfPDfSD/src/mapping/db2dto"
	"bp-bures-SfPDfSD/src/persistence/rdb/schema"
	"bp-bures-SfPDfSD/src/util"
	"log"
	"strings"

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
	ObtainKPIDefinitionsForTheGivenDeviceType(deviceType string) ([]dto.KPIDefinitionDTO, error)
	ObtainUserDefinedDeviceTypeByID(id uint32) (dto.UserDefinedDeviceTypeDTO, error)
	ObtainAllUserDefinedDeviceTypes() ([]dto.UserDefinedDeviceTypeDTO, error)
	InsertUserDefinedDeviceType(userDefinedDeviceTypeDTO dto.UserDefinedDeviceTypeDTO) (uint32, error)
	DeleteUserDefinedDeviceType(id uint32) error
}

type relationalDatabaseClientImpl struct {
	db *gorm.DB
}

var rdbClientInstance RelationalDatabaseClient

func GetRelationalDatabaseClientReference() *RelationalDatabaseClient {

	return &rdbClientInstance
}

func SetupRelationalDatabaseClient() error {

	var err error
	rdbClientInstance = &relationalDatabaseClientImpl{db: nil}

	if err = rdbClientInstance.ConnectToDatabase(); err != nil {
		return err
	}

	if err = rdbClientInstance.InitializeDatabase(); err != nil {
		return err
	}

	return nil
}

func (r *relationalDatabaseClientImpl) ConnectToDatabase() error {

	var err error
	r.db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Println("Error connecting to relational-database:", err)
		return err
	}

	r.db = r.db.Session(&gorm.Session{Logger: logger.Default.LogMode(logger.Silent)})

	log.Println("Successfully connected to the relational-database.")
	return nil
}

func (r *relationalDatabaseClientImpl) setupTables() error {

	err := r.db.AutoMigrate(
		&schema.KPIDefinitionEntity{},
		&schema.GenericKPINodeEntity{},
		&schema.LogicalOperatorNodeEntity{},
		&schema.SubKPIDefinitionNodeEntity{},

		&schema.UserDefinedDeviceTypeEntity{},
		&schema.DeviceTypeParameterEntity{},
	)

	if err != nil {
		log.Println("Error on DB.AutoMigrate(): ", err)
		return err
	}
	return nil
}

func (r *relationalDatabaseClientImpl) optionallyInsertKPIDefinitionData() error {

	var err error

	var count int64
	r.db.Model(&schema.KPIDefinitionEntity{}).Count(&count)
	if count > 0 {
		log.Println("The KPI definition data seem to be present: skipping insertion.")
		return nil
	}

	for _, kpiDefinitionDTO := range util.GetArtificialKPIDefinitions() {
		err = r.insertKPIDefinitionDTOIntoTheDatabase(kpiDefinitionDTO)
		if err != nil {
			log.Println("Error on insertKPIDefinitionDTOIntoTheDatabase(...): ", err)
			return err
		}
	}

	log.Println("Successfully inserted user defined device types data into the relational-database...")
	return nil
}

func (r *relationalDatabaseClientImpl) InitializeDatabase() error {

	if err := r.setupTables(); err != nil {
		return err
	}

	if err := r.optionallyInsertKPIDefinitionData(); err != nil {
		return err
	}

	return nil
}

func (r *relationalDatabaseClientImpl) insertKPIDefinitionDTOIntoTheDatabase(kpiDefinition dto.KPIDefinitionDTO) error {

	genericKPINodeEntity, genericKPINodeEntities, logicalOperatorNodeEntities, subKPIDefinitionNodeEntities := transformKPIDefinitionTree(kpiDefinition.DefinitionRootNode, nil, []*schema.GenericKPINodeEntity{}, []schema.LogicalOperatorNodeEntity{}, []schema.SubKPIDefinitionNodeEntity{})

	kpiDefinitionEntity := schema.KPIDefinitionEntity{
		DeviceTypeSpecification:  kpiDefinition.DeviceTypeSpecification,
		HumanReadableDescription: kpiDefinition.HumanReadableDescription,
		DefinitionRootNode:       genericKPINodeEntity,
	}

	for index, entity := range genericKPINodeEntities {
		if err := r.db.Create(&entity).Error; err != nil {
			return err
		}
		genericKPINodeEntities[index] = entity
	}

	if err := r.db.Create(&kpiDefinitionEntity).Error; err != nil {
		return err
	}

	for index, entity := range logicalOperatorNodeEntities {
		if err := r.db.Create(&entity).Error; err != nil {
			return err
		}
		logicalOperatorNodeEntities[index] = entity
	}

	for index, entity := range subKPIDefinitionNodeEntities {
		if err := r.db.Create(&entity).Error; err != nil {
			return err
		}
		subKPIDefinitionNodeEntities[index] = entity
	}

	return nil
}

func (r *relationalDatabaseClientImpl) ObtainKPIDefinitionsForTheGivenDeviceType(targetDeviceType string) ([]dto.KPIDefinitionDTO, error) {

	var err error

	var kpiDefinitionEntities []schema.KPIDefinitionEntity
	kpiDefinitionEntities, err = r.fetchKPIDefinitionEntities(targetDeviceType)
	if err != nil {
		return nil, err
	}

	var genericKPINodeEntities []schema.GenericKPINodeEntity
	genericKPINodeEntities, err = r.fetchGenericKPINodeEntities(kpiDefinitionEntities)
	if err != nil {
		return nil, err
	}

	var logicalOperatorNodeEntities []schema.LogicalOperatorNodeEntity
	logicalOperatorNodeEntities, err = r.fetchLogicalOperatorNodeEntities(genericKPINodeEntities)
	if err != nil {
		return nil, err
	}

	var subKPIDefinitionNodeEntities []schema.SubKPIDefinitionNodeEntity
	subKPIDefinitionNodeEntities, err = r.fetchSubKPIDefinitionNodeEntities(genericKPINodeEntities)
	if err != nil {
		return nil, err
	}

	var kpiDefinitions []dto.KPIDefinitionDTO
	for _, kpiDefinitionEntity := range kpiDefinitionEntities {
		kpiDefinition := reconstructKPIDefinition(kpiDefinitionEntity, genericKPINodeEntities, logicalOperatorNodeEntities, subKPIDefinitionNodeEntities)
		kpiDefinitions = append(kpiDefinitions, kpiDefinition)
	}

	return kpiDefinitions, nil
}

func (r *relationalDatabaseClientImpl) ObtainUserDefinedDeviceTypeByID(id uint32) (dto.UserDefinedDeviceTypeDTO, error) {

	var userDefinedDeviceTypesEntity schema.UserDefinedDeviceTypeEntity
	err := r.db.Preload("Parameters").Where("id = ?", id).First(&userDefinedDeviceTypesEntity).Error

	userDefinedDeviceTypeDTO, err := db2dto.MapUserDefinedDeviceTypeEntityToUserDefinedDeviceTypeDTO(userDefinedDeviceTypesEntity) // TODO: Relocate this to service layer once it exists...
	return *userDefinedDeviceTypeDTO, err
}

func (r *relationalDatabaseClientImpl) ObtainAllUserDefinedDeviceTypes() ([]dto.UserDefinedDeviceTypeDTO, error) {

	var userDefinedDeviceTypesEntities []schema.UserDefinedDeviceTypeEntity
	err := r.db.Preload("Parameters").Find(&userDefinedDeviceTypesEntities).Error

	userDefinedDeviceTypeDTOs, err := db2dto.MapUserDefinedDeviceTypeEntitiesToUserDefinedDeviceTypeDTOs(userDefinedDeviceTypesEntities) // TODO: Relocate this to service layer once it exists...
	return userDefinedDeviceTypeDTOs, err
}

func (r *relationalDatabaseClientImpl) InsertUserDefinedDeviceType(userDefinedDeviceTypeDTO dto.UserDefinedDeviceTypeDTO) (uint32, error) {

	deviceTypeParameterEntities := make([]schema.DeviceTypeParameterEntity, len(userDefinedDeviceTypeDTO.Parameters))

	for index, userDefinedDeviceParameterDTO := range userDefinedDeviceTypeDTO.Parameters {
		deviceTypeParameterEntities[index] = schema.DeviceTypeParameterEntity{
			Name: userDefinedDeviceParameterDTO.Name,
			Type: strings.ToLower(string(userDefinedDeviceParameterDTO.Type)),
		}
	}

	userDefinedDeviceTypeEntity := schema.UserDefinedDeviceTypeEntity{
		Denotation: userDefinedDeviceTypeDTO.Denotation,
		Parameters: deviceTypeParameterEntities,
	}

	if err := r.db.Create(&userDefinedDeviceTypeEntity).Error; err != nil {
		return 0, err
	}

	return userDefinedDeviceTypeEntity.ID, nil
}

func (r *relationalDatabaseClientImpl) DeleteUserDefinedDeviceType(id uint32) error { // TODO: Consider introducing database deletion constraints (ON DELETE CASCADE) to simplify this...

	var userDefinedDeviceTypeEntity schema.UserDefinedDeviceTypeEntity

	if err := r.db.Preload("Parameters").Where("id = ?", id).First(&userDefinedDeviceTypeEntity).Error; err != nil {
		return err
	}

	tx := r.db.Begin()

	if len(userDefinedDeviceTypeEntity.Parameters) > 0 {
		if err := tx.Where("user_defined_device_type_id = ?", userDefinedDeviceTypeEntity.ID).Delete(&schema.DeviceTypeParameterEntity{}).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	if err := tx.Delete(&userDefinedDeviceTypeEntity).Error; err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Commit().Error; err != nil {
		return err
	}

	return nil
}
