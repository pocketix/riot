package rdb

import (
	"bp-bures-SfPDfSD/src/dto"
	"bp-bures-SfPDfSD/src/mapping/db2dto"
	"bp-bures-SfPDfSD/src/mapping/dto2db"
	"bp-bures-SfPDfSD/src/persistence/rdb/schema"
	"bp-bures-SfPDfSD/src/util"
	"github.com/thoas/go-funk"
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
	ObtainDeviceTypeByID(id uint32) (dto.DeviceTypeDTO, error)
	ObtainAllDeviceTypes() ([]dto.DeviceTypeDTO, error)
	InsertDeviceType(DeviceTypeDTO dto.DeviceTypeDTO) (uint32, error)
	DeleteDeviceType(id uint32) error
	InsertOrUpdateDevice(deviceDTO dto.DeviceDTO) (uint32, error)
	ObtainDeviceByID(id uint32) (dto.DeviceDTO, error)
	ObtainAllDevices() ([]dto.DeviceDTO, error)
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

		&schema.DeviceTypeEntity{},
		&schema.DeviceTypeParameterEntity{},
		&schema.DeviceEntity{},
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

func (r *relationalDatabaseClientImpl) ObtainDeviceTypeByID(id uint32) (dto.DeviceTypeDTO, error) {

	var deviceTypeEntity schema.DeviceTypeEntity
	err := r.db.Preload("Parameters").Where("id = ?", id).First(&deviceTypeEntity).Error

	deviceTypeDTO, err := db2dto.MapDeviceTypeEntityToDeviceTypeDTO(deviceTypeEntity) // TODO: Relocate this to service layer once it exists...
	return *deviceTypeDTO, err
}

func (r *relationalDatabaseClientImpl) ObtainAllDeviceTypes() ([]dto.DeviceTypeDTO, error) {

	var deviceTypeEntities []schema.DeviceTypeEntity
	err := r.db.Preload("Parameters").Find(&deviceTypeEntities).Error

	deviceTypeDTOs, err := db2dto.MapDeviceTypeEntitiesToDeviceTypeDTOs(deviceTypeEntities) // TODO: Relocate this to service layer once it exists...
	return deviceTypeDTOs, err
}

func (r *relationalDatabaseClientImpl) InsertDeviceType(DeviceTypeDTO dto.DeviceTypeDTO) (uint32, error) {

	deviceTypeParameterEntities := make([]schema.DeviceTypeParameterEntity, len(DeviceTypeDTO.Parameters))

	for index, deviceParameterDTO := range DeviceTypeDTO.Parameters {
		deviceTypeParameterEntities[index] = schema.DeviceTypeParameterEntity{
			Name: deviceParameterDTO.Name,
			Type: strings.ToLower(string(deviceParameterDTO.Type)),
		}
	}

	deviceTypeEntity := schema.DeviceTypeEntity{
		Denotation: DeviceTypeDTO.Denotation,
		Parameters: deviceTypeParameterEntities,
	}

	if err := r.db.Create(&deviceTypeEntity).Error; err != nil {
		return 0, err
	}

	return deviceTypeEntity.ID, nil
}

func (r *relationalDatabaseClientImpl) DeleteDeviceType(id uint32) error { // TODO: Consider introducing database deletion constraints (ON DELETE CASCADE) to simplify this...

	var deviceTypeEntity schema.DeviceTypeEntity

	if err := r.db.Preload("Parameters").Where("id = ?", id).First(&deviceTypeEntity).Error; err != nil {
		return err
	}

	tx := r.db.Begin()

	if len(deviceTypeEntity.Parameters) > 0 {
		if err := tx.Where("user_defined_device_type_id = ?", deviceTypeEntity.ID).Delete(&schema.DeviceTypeParameterEntity{}).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	if err := tx.Delete(&deviceTypeEntity).Error; err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Commit().Error; err != nil {
		return err
	}

	return nil
}

func (r *relationalDatabaseClientImpl) InsertOrUpdateDevice(deviceDTO dto.DeviceDTO) (uint32, error) {

	var deviceEntity = dto2db.MapDeviceDTOToDeviceEntity(deviceDTO)

	if err := r.db.Save(&deviceEntity).Error; err != nil {
		return 0, err
	}

	return deviceEntity.ID, nil
}

func (r *relationalDatabaseClientImpl) ObtainDeviceByID(id uint32) (dto.DeviceDTO, error) {

	var err error
	var deviceEntity schema.DeviceEntity
	var deviceTypeEntity schema.DeviceTypeEntity

	err = r.db.Where("id = ?", id).First(&deviceEntity).Error
	err = r.db.Preload("Parameters").Where("id = ?", deviceEntity.DeviceTypeID).First(&deviceTypeEntity).Error

	deviceEntity.DeviceType = deviceTypeEntity

	return db2dto.MapDeviceEntityToDeviceDTO(deviceEntity), err
}

func (r *relationalDatabaseClientImpl) ObtainAllDevices() ([]dto.DeviceDTO, error) {

	var deviceEntities []schema.DeviceEntity
	if err := r.db.Find(&deviceEntities).Error; err != nil {
		return nil, err
	}

	for index, deviceEntity := range deviceEntities { // TODO: Is this any better than getting all device types at once and mapping them against devices?
		var deviceTypeEntity schema.DeviceTypeEntity
		if err := r.db.Preload("Parameters").Where("id = ?", deviceEntity.DeviceTypeID).First(&deviceTypeEntity).Error; err != nil {
			return nil, err
		}
		deviceEntity.DeviceType = deviceTypeEntity
		deviceEntities[index] = deviceEntity
	}

	return funk.Map(deviceEntities, db2dto.MapDeviceEntityToDeviceDTO).([]dto.DeviceDTO), nil
}
