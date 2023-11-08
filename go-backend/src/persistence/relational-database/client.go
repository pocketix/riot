package relational_database

import (
	"bp-bures-SfPDfSD/src/dto"
	"bp-bures-SfPDfSD/src/util"
	"errors"
	"fmt"
	"log"

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
	ObtainUserDefinedDeviceTypeByID(id uint32) (UserDefinedDeviceTypeEntity, error)
	ObtainAllUserDefinedDeviceTypes() ([]UserDefinedDeviceTypeEntity, error)
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
		&KPIDefinitionEntity{},
		&GenericKPINodeEntity{},
		&LogicalOperatorNodeEntity{},
		&SubKPIDefinitionNodeEntity{},

		&UserDefinedDeviceTypeEntity{},
		&DeviceTypeParameterEntity{},
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
	r.db.Model(&KPIDefinitionEntity{}).Count(&count)
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

	log.Println("Successfully inserted KPI definition data into the relational-database...")
	return nil
}

func (r *relationalDatabaseClientImpl) optionallyInsertUserDefinedDeviceTypesData() error {

	var err error

	var count int64
	r.db.Model(&UserDefinedDeviceTypeEntity{}).Count(&count)
	if count > 0 {
		log.Println("The user defined device types data seem to be present: skipping insertion.")
		return nil
	}

	err = r.db.Create(&UserDefinedDeviceTypeEntity{
		Denotation: "shelly1pro",
		Parameters: []DeviceTypeParameterEntity{
			{
				Name: "relay_0_temperature",
				Type: "number",
			},
			{
				Name: "relay_0_source",
				Type: "string",
			},
		},
	}).Error

	if err != nil {
		return err
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

	if err := r.optionallyInsertUserDefinedDeviceTypesData(); err != nil {
		return err
	}

	return nil
}

func transformKPIDefinitionTree(
	node dto.FulfillableNode,
	parentGenericKPINodeEntity *GenericKPINodeEntity,
	genericKPINodeEntities []*GenericKPINodeEntity,
	logicalOperatorNodeEntities []LogicalOperatorNodeEntity,
	subKPIDefinitionNodeEntities []SubKPIDefinitionNodeEntity,
) (
	*GenericKPINodeEntity,
	[]*GenericKPINodeEntity,
	[]LogicalOperatorNodeEntity,
	[]SubKPIDefinitionNodeEntity,
) {

	currentNodeEntity := &GenericKPINodeEntity{
		ParentNode: parentGenericKPINodeEntity,
	}
	genericKPINodeEntities = append(genericKPINodeEntities, currentNodeEntity)

	switch typedNode := node.(type) {
	case *dto.LogicalOperatorNodeDTO:
		logicalOperatorNodeEntities = append(logicalOperatorNodeEntities, LogicalOperatorNodeEntity{
			Node: currentNodeEntity,
			Type: string(typedNode.Type),
		})
		for _, childNode := range typedNode.ChildNodes {
			_, genericKPINodeEntities, logicalOperatorNodeEntities, subKPIDefinitionNodeEntities = transformKPIDefinitionTree(childNode, currentNodeEntity, genericKPINodeEntities, logicalOperatorNodeEntities, subKPIDefinitionNodeEntities)
		}
	case *dto.StringEqualitySubKPIDefinitionNodeDTO:
		subKPIDefinitionNodeEntities = append(subKPIDefinitionNodeEntities, SubKPIDefinitionNodeEntity{
			Node:                         currentNodeEntity,
			DeviceParameterSpecification: typedNode.DeviceParameterSpecification,
			Type:                         "string_equality",
			FirstNumericReferenceValue:   nil,
			SecondNumericReferenceValue:  nil,
			StringReferenceValue:         &typedNode.ReferenceValue,
			BooleanReferenceValue:        nil,
		})
	case *dto.NumericLessThanSubKPIDefinitionNodeDTO:
		subKPIDefinitionNodeEntities = append(subKPIDefinitionNodeEntities, SubKPIDefinitionNodeEntity{
			Node:                         currentNodeEntity,
			DeviceParameterSpecification: typedNode.DeviceParameterSpecification,
			Type:                         "numeric_less_than",
			FirstNumericReferenceValue:   &typedNode.ReferenceValue,
			SecondNumericReferenceValue:  nil,
			StringReferenceValue:         nil,
			BooleanReferenceValue:        nil,
		})
	case *dto.NumericGreaterThanSubKPIDefinitionNodeDTO:
		subKPIDefinitionNodeEntities = append(subKPIDefinitionNodeEntities, SubKPIDefinitionNodeEntity{
			Node:                         currentNodeEntity,
			DeviceParameterSpecification: typedNode.DeviceParameterSpecification,
			Type:                         "numeric_greater_than",
			FirstNumericReferenceValue:   &typedNode.ReferenceValue,
			SecondNumericReferenceValue:  nil,
			StringReferenceValue:         nil,
			BooleanReferenceValue:        nil,
		})
	case *dto.NumericEqualitySubKPIDefinitionNodeDTO:
		subKPIDefinitionNodeEntities = append(subKPIDefinitionNodeEntities, SubKPIDefinitionNodeEntity{
			Node:                         currentNodeEntity,
			DeviceParameterSpecification: typedNode.DeviceParameterSpecification,
			Type:                         "numeric_equality",
			FirstNumericReferenceValue:   &typedNode.ReferenceValue,
			SecondNumericReferenceValue:  nil,
			StringReferenceValue:         nil,
			BooleanReferenceValue:        nil,
		})
	case *dto.NumericInRangeSubKPIDefinitionNodeDTO:
		subKPIDefinitionNodeEntities = append(subKPIDefinitionNodeEntities, SubKPIDefinitionNodeEntity{
			Node:                         currentNodeEntity,
			DeviceParameterSpecification: typedNode.DeviceParameterSpecification,
			Type:                         "numeric_in_range",
			FirstNumericReferenceValue:   &typedNode.LowerBoundaryValue,
			SecondNumericReferenceValue:  &typedNode.UpperBoundaryValue,
			StringReferenceValue:         nil,
			BooleanReferenceValue:        nil,
		})
	case *dto.BooleanEqualitySubKPIDefinitionNodeDTO:
		subKPIDefinitionNodeEntities = append(subKPIDefinitionNodeEntities, SubKPIDefinitionNodeEntity{
			Node:                         currentNodeEntity,
			DeviceParameterSpecification: typedNode.DeviceParameterSpecification,
			Type:                         "boolean_equality",
			FirstNumericReferenceValue:   nil,
			SecondNumericReferenceValue:  nil,
			StringReferenceValue:         nil,
			BooleanReferenceValue:        &typedNode.ReferenceValue,
		})
	}

	return currentNodeEntity, genericKPINodeEntities, logicalOperatorNodeEntities, subKPIDefinitionNodeEntities
}

func (r *relationalDatabaseClientImpl) insertKPIDefinitionDTOIntoTheDatabase(kpiDefinition dto.KPIDefinitionDTO) error {

	genericKPINodeEntity, genericKPINodeEntities, logicalOperatorNodeEntities, subKPIDefinitionNodeEntities := transformKPIDefinitionTree(kpiDefinition.DefinitionRootNode, nil, []*GenericKPINodeEntity{}, []LogicalOperatorNodeEntity{}, []SubKPIDefinitionNodeEntity{})

	kpiDefinitionEntity := KPIDefinitionEntity{
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

func (r *relationalDatabaseClientImpl) fetchRemainingGenericKPINodeEntities(topGenericKPINodeEntities []GenericKPINodeEntity) ([]GenericKPINodeEntity, error) {

	var allNodes []GenericKPINodeEntity
	for _, topGenericKPINodeEntity := range topGenericKPINodeEntities {

		var nodes []GenericKPINodeEntity
		if err := r.db.Where("parent_node_id = ?", topGenericKPINodeEntity.ID).Find(&nodes).Error; err != nil {
			return nil, err
		}

		for _, node := range nodes {
			allNodes = append(allNodes, node)
			childNodes, err := r.fetchRemainingGenericKPINodeEntities([]GenericKPINodeEntity{node})
			if err != nil {
				return nil, err
			}
			allNodes = append(allNodes, childNodes...)
		}
	}
	return allNodes, nil
}

func (r *relationalDatabaseClientImpl) fetchKPIDefinitionEntities(targetDeviceType string) ([]KPIDefinitionEntity, error) {

	var err error
	var kpiDefinitionEntities []KPIDefinitionEntity

	err = r.db.Where("device_type_specification = ?", targetDeviceType).Find(&kpiDefinitionEntities).Error
	if err != nil {
		log.Println("Error loading data from relational-database:", err)
		return nil, fmt.Errorf("error obtaining data from the '%s' table: %w", KPIDefinitionTableName, err)
	}

	return kpiDefinitionEntities, nil
}

func (r *relationalDatabaseClientImpl) fetchGenericKPINodeEntities(kpiDefinitionEntities []KPIDefinitionEntity) ([]GenericKPINodeEntity, error) {

	var err error
	var genericKPINodeEntities []GenericKPINodeEntity

	for _, kpiDefinitionEntity := range kpiDefinitionEntities {

		var rootGenericKPINodeEntity GenericKPINodeEntity
		err = r.db.Where("id = ?", kpiDefinitionEntity.DefinitionRootNodeID).First(&rootGenericKPINodeEntity).Error
		if err == nil {
			genericKPINodeEntities = append(genericKPINodeEntities, rootGenericKPINodeEntity)
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			log.Println("Error loading data from relational-database:", err)
			return nil, fmt.Errorf("error obtaining data from the '%s' table: %w", GenericKPINodeTableName, err)
		}

		var topGenericKPINodeEntities []GenericKPINodeEntity
		err = r.db.Where("parent_node_id = ?", kpiDefinitionEntity.DefinitionRootNodeID).Find(&topGenericKPINodeEntities).Error
		if err != nil {
			log.Println("Error loading data from relational-database:", err)
			return nil, fmt.Errorf("error obtaining data from the '%s' table: %w", GenericKPINodeTableName, err)
		}
		genericKPINodeEntities = append(genericKPINodeEntities, topGenericKPINodeEntities...)

		var allRemainingGenericKPINodeEntities []GenericKPINodeEntity
		allRemainingGenericKPINodeEntities, err = r.fetchRemainingGenericKPINodeEntities(topGenericKPINodeEntities)
		if err != nil {
			log.Println("Error loading data from relational-database:", err)
			return nil, fmt.Errorf("error obtaining data from the '%s' table: %w", GenericKPINodeTableName, err)
		}
		genericKPINodeEntities = append(genericKPINodeEntities, allRemainingGenericKPINodeEntities...)
	}

	return genericKPINodeEntities, nil
}

func (r *relationalDatabaseClientImpl) fetchLogicalOperatorNodeEntities(genericKPINodeEntities []GenericKPINodeEntity) ([]LogicalOperatorNodeEntity, error) { // TODO: One could most-likely merge fetchLogicalOperatorNodeEntities and fetchSubKPIDefinitionNodeEntities using generics or common interface...

	var err error
	var logicalOperatorNodeEntities []LogicalOperatorNodeEntity

	for _, genericKPINodeEntity := range genericKPINodeEntities {
		var logicalOperatorNodeEntity LogicalOperatorNodeEntity
		err = r.db.Where("node_id = ?", genericKPINodeEntity.ID).First(&logicalOperatorNodeEntity).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				continue
			} else {
				log.Println("Error loading data from relational-database:", err)
				return nil, fmt.Errorf("error obtaining data from the '%s' table: %w", LogicalOperatorNodeTableName, err)
			}
		}
		logicalOperatorNodeEntities = append(logicalOperatorNodeEntities, logicalOperatorNodeEntity)
	}

	return logicalOperatorNodeEntities, nil
}

func (r *relationalDatabaseClientImpl) fetchSubKPIDefinitionNodeEntities(genericKPINodeEntities []GenericKPINodeEntity) ([]SubKPIDefinitionNodeEntity, error) {

	var err error
	var subKPIDefinitionNodeEntities []SubKPIDefinitionNodeEntity

	for _, genericKPINodeEntity := range genericKPINodeEntities {
		var subKPIDefinitionNodeEntity SubKPIDefinitionNodeEntity
		err = r.db.Where("node_id = ?", genericKPINodeEntity.ID).First(&subKPIDefinitionNodeEntity).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				continue
			} else {
				log.Println("Error loading data from relational-database:", err)
				return nil, fmt.Errorf("error obtaining data from the '%s' table: %w", SubKPIDefinitionNodeTableName, err)
			}
		}
		subKPIDefinitionNodeEntities = append(subKPIDefinitionNodeEntities, subKPIDefinitionNodeEntity)
	}

	return subKPIDefinitionNodeEntities, nil
}

func prepareNodeChildrenMap(genericKPINodeEntities []GenericKPINodeEntity) map[uint32][]GenericKPINodeEntity {

	nodeChildrenMap := make(map[uint32][]GenericKPINodeEntity)
	for _, genericKPINodeEntity := range genericKPINodeEntities {
		if genericKPINodeEntity.ParentNodeID != nil {
			parentNodeID := *genericKPINodeEntity.ParentNodeID
			nodeChildrenMap[parentNodeID] = append(nodeChildrenMap[parentNodeID], genericKPINodeEntity)
		}
	}
	return nodeChildrenMap
}

func reconstructNodeTree(genericKPINodeEntity GenericKPINodeEntity, nodeChildrenMap map[uint32][]GenericKPINodeEntity, logicalOperatorNodeEntities []LogicalOperatorNodeEntity, subKPIDefinitionNodeEntities []SubKPIDefinitionNodeEntity) dto.FulfillableNode {

	for _, logicalOperatorNodeEntity := range logicalOperatorNodeEntities {

		logicalOperatorNodeEntityNodeID := *logicalOperatorNodeEntity.NodeID
		if logicalOperatorNodeEntityNodeID == genericKPINodeEntity.ID {

			childGenericKPINodeEntities := nodeChildrenMap[logicalOperatorNodeEntityNodeID]
			var childNodes []dto.FulfillableNode
			for _, childGenericKPINodeEntity := range childGenericKPINodeEntities {
				childNode := reconstructNodeTree(childGenericKPINodeEntity, nodeChildrenMap, logicalOperatorNodeEntities, subKPIDefinitionNodeEntities)
				childNodes = append(childNodes, childNode)
			}
			return &dto.LogicalOperatorNodeDTO{
				Type:       dto.LogicalOperatorNodeType(logicalOperatorNodeEntity.Type),
				ChildNodes: childNodes,
			}
		}
	}

	for _, subKPIDefinitionNodeEntity := range subKPIDefinitionNodeEntities {
		if *subKPIDefinitionNodeEntity.NodeID == genericKPINodeEntity.ID {
			subKPIDefinitionBaseNode := dto.SubKPIDefinitionBaseNodeDTO{
				DeviceParameterSpecification: subKPIDefinitionNodeEntity.DeviceParameterSpecification,
			}
			switch subKPIDefinitionNodeEntity.Type {
			case "string_equality":
				return &dto.StringEqualitySubKPIDefinitionNodeDTO{
					SubKPIDefinitionBaseNodeDTO: subKPIDefinitionBaseNode,
					ReferenceValue:              *subKPIDefinitionNodeEntity.StringReferenceValue,
				}
			case "numeric_less_than":
				return &dto.NumericLessThanSubKPIDefinitionNodeDTO{
					SubKPIDefinitionBaseNodeDTO: subKPIDefinitionBaseNode,
					ReferenceValue:              *subKPIDefinitionNodeEntity.FirstNumericReferenceValue,
				}
			case "numeric_greater_than":
				return &dto.NumericGreaterThanSubKPIDefinitionNodeDTO{
					SubKPIDefinitionBaseNodeDTO: subKPIDefinitionBaseNode,
					ReferenceValue:              *subKPIDefinitionNodeEntity.FirstNumericReferenceValue,
				}
			case "numeric_equality":
				return &dto.NumericEqualitySubKPIDefinitionNodeDTO{
					SubKPIDefinitionBaseNodeDTO: subKPIDefinitionBaseNode,
					ReferenceValue:              *subKPIDefinitionNodeEntity.FirstNumericReferenceValue,
				}
			case "numeric_in_range":
				return &dto.NumericInRangeSubKPIDefinitionNodeDTO{
					SubKPIDefinitionBaseNodeDTO: subKPIDefinitionBaseNode,
					LowerBoundaryValue:          *subKPIDefinitionNodeEntity.FirstNumericReferenceValue,
					UpperBoundaryValue:          *subKPIDefinitionNodeEntity.SecondNumericReferenceValue,
				}
			case "boolean_equality":
				return &dto.BooleanEqualitySubKPIDefinitionNodeDTO{
					SubKPIDefinitionBaseNodeDTO: subKPIDefinitionBaseNode,
					ReferenceValue:              *subKPIDefinitionNodeEntity.BooleanReferenceValue,
				}
			}
		}
	}

	return nil
}

func reconstructKPIDefinition(kpiDefinitionEntity KPIDefinitionEntity, genericKPINodeEntities []GenericKPINodeEntity, logicalOperatorNodeEntities []LogicalOperatorNodeEntity, subKPIDefinitionNodeEntities []SubKPIDefinitionNodeEntity) dto.KPIDefinitionDTO {

	var definitionRoot dto.FulfillableNode
	nodeChildrenMap := prepareNodeChildrenMap(genericKPINodeEntities)

	for _, genericKPINodeEntity := range genericKPINodeEntities {
		if genericKPINodeEntity.ID == *kpiDefinitionEntity.DefinitionRootNodeID {
			definitionRoot = reconstructNodeTree(genericKPINodeEntity, nodeChildrenMap, logicalOperatorNodeEntities, subKPIDefinitionNodeEntities)
			break
		}
	}

	return dto.KPIDefinitionDTO{
		DeviceTypeSpecification:  kpiDefinitionEntity.DeviceTypeSpecification,
		HumanReadableDescription: kpiDefinitionEntity.HumanReadableDescription,
		DefinitionRootNode:       definitionRoot,
	}
}

func (r *relationalDatabaseClientImpl) ObtainKPIDefinitionsForTheGivenDeviceType(targetDeviceType string) ([]dto.KPIDefinitionDTO, error) {

	var err error

	var kpiDefinitionEntities []KPIDefinitionEntity
	kpiDefinitionEntities, err = r.fetchKPIDefinitionEntities(targetDeviceType)
	if err != nil {
		return nil, err
	}

	var genericKPINodeEntities []GenericKPINodeEntity
	genericKPINodeEntities, err = r.fetchGenericKPINodeEntities(kpiDefinitionEntities)
	if err != nil {
		return nil, err
	}

	var logicalOperatorNodeEntities []LogicalOperatorNodeEntity
	logicalOperatorNodeEntities, err = r.fetchLogicalOperatorNodeEntities(genericKPINodeEntities)
	if err != nil {
		return nil, err
	}

	var subKPIDefinitionNodeEntities []SubKPIDefinitionNodeEntity
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

func (r *relationalDatabaseClientImpl) ObtainUserDefinedDeviceTypeByID(id uint32) (UserDefinedDeviceTypeEntity, error) {

	var userDefinedDeviceTypesEntity UserDefinedDeviceTypeEntity
	err := r.db.Preload("Parameters").Where("id = ?", id).First(&userDefinedDeviceTypesEntity).Error

	return userDefinedDeviceTypesEntity, err
}

func (r *relationalDatabaseClientImpl) ObtainAllUserDefinedDeviceTypes() ([]UserDefinedDeviceTypeEntity, error) {

	var userDefinedDeviceTypesEntities []UserDefinedDeviceTypeEntity
	err := r.db.Preload("Parameters").Find(&userDefinedDeviceTypesEntities).Error

	return userDefinedDeviceTypesEntities, err
}
