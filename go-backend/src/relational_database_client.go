package main

import (
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
	ObtainRootKPIDefinitionsForTheGivenDeviceType(deviceType string) ([]RootKPIDefinition, error)
	ObtainUserDefinedDeviceTypeByID(id uint32) (UserDefinedDeviceTypesEntity, error)
}

type relationalDatabaseClientImpl struct {
	db *gorm.DB
}

// NewRelationalDatabaseClient is a constructor-like function that returns an instance of RelationalDatabaseClient
func NewRelationalDatabaseClient() RelationalDatabaseClient {
	return &relationalDatabaseClientImpl{db: nil}
}

func (r *relationalDatabaseClientImpl) ConnectToDatabase() error {

	var err error
	r.db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Println("Error connecting to database:", err)
		return err
	}

	r.db = r.db.Session(&gorm.Session{Logger: logger.Default.LogMode(logger.Silent)})

	log.Println("Successfully connected to the database.")
	return nil
}

func (r *relationalDatabaseClientImpl) setupTables() error {

	err := r.db.AutoMigrate(
		&RootKPIDefinitionEntity{},
		&GenericKPINodeEntity{},
		&LogicalOperatorNodeEntity{},
		&SubKPIDefinitionNodeEntity{},

		&UserDefinedDeviceTypesEntity{},
		&DeviceTypeParametersEntity{},
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
	r.db.Model(&RootKPIDefinitionEntity{}).Count(&count)
	if count > 0 {
		log.Println("The KPI definition data seem to be present: skipping insertion.")
		return nil
	}

	for _, rootKPIDefinitionObject := range GetRootKPIDefinitions() {
		err = r.insertRootKPIDefinitionIntoTheDatabase(rootKPIDefinitionObject)
		if err != nil {
			log.Println("Error on insertRootKPIDefinitionIntoTheDatabase(...): ", err)
			return err
		}
	}

	log.Println("Successfully inserted KPI definition data into the database...")
	return nil
}

func (r *relationalDatabaseClientImpl) optionallyInsertUserDefinedDeviceTypesData() error {

	var err error

	var count int64
	r.db.Model(&UserDefinedDeviceTypesEntity{}).Count(&count)
	if count > 0 {
		log.Println("The user defined device types data seem to be present: skipping insertion.")
		return nil
	}

	err = r.db.Create(&UserDefinedDeviceTypesEntity{
		Denotation: "shelly1pro",
		Parameters: []DeviceTypeParametersEntity{
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

	log.Println("Successfully inserted user defined device types data into the database...")
	return nil
}

func (r *relationalDatabaseClientImpl) InitializeDatabase() error {

	var err error

	err = r.setupTables()
	if err != nil {
		return err
	}

	err = r.optionallyInsertKPIDefinitionData()
	if err != nil {
		return err
	}

	err = r.optionallyInsertUserDefinedDeviceTypesData()
	if err != nil {
		return err
	}

	return nil
}

func transformKPIDefinitionTree(
	node Node,
	parent *GenericKPINodeEntity,
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
		ParentNode: parent,
	}
	genericKPINodeEntities = append(genericKPINodeEntities, currentNodeEntity)

	switch typedNode := node.(type) {
	case *LogicalOperatorNode:
		logicalOperatorNodeEntities = append(logicalOperatorNodeEntities, LogicalOperatorNodeEntity{
			Node: currentNodeEntity,
			Type: typedNode.Type,
		})
		for _, childNode := range typedNode.ChildNodes {
			_, genericKPINodeEntities, logicalOperatorNodeEntities, subKPIDefinitionNodeEntities = transformKPIDefinitionTree(childNode, currentNodeEntity, genericKPINodeEntities, logicalOperatorNodeEntities, subKPIDefinitionNodeEntities)
		}
	case *StringEqualitySubKPIDefinitionNode:
		subKPIDefinitionNodeEntities = append(subKPIDefinitionNodeEntities, SubKPIDefinitionNodeEntity{
			Node:                         currentNodeEntity,
			DeviceParameterSpecification: typedNode.DeviceParameterSpecification,
			Type:                         "string_equality",
			FirstNumericReferenceValue:   nil,
			SecondNumericReferenceValue:  nil,
			StringReferenceValue:         &typedNode.ReferenceValue,
			BooleanReferenceValue:        nil,
		})
	case *NumericLessThanSubKPIDefinitionNode:
		subKPIDefinitionNodeEntities = append(subKPIDefinitionNodeEntities, SubKPIDefinitionNodeEntity{
			Node:                         currentNodeEntity,
			DeviceParameterSpecification: typedNode.DeviceParameterSpecification,
			Type:                         "numeric_less_than",
			FirstNumericReferenceValue:   &typedNode.ReferenceValue,
			SecondNumericReferenceValue:  nil,
			StringReferenceValue:         nil,
			BooleanReferenceValue:        nil,
		})
	case *NumericGreaterThanSubKPIDefinitionNode:
		subKPIDefinitionNodeEntities = append(subKPIDefinitionNodeEntities, SubKPIDefinitionNodeEntity{
			Node:                         currentNodeEntity,
			DeviceParameterSpecification: typedNode.DeviceParameterSpecification,
			Type:                         "numeric_greater_than",
			FirstNumericReferenceValue:   &typedNode.ReferenceValue,
			SecondNumericReferenceValue:  nil,
			StringReferenceValue:         nil,
			BooleanReferenceValue:        nil,
		})
	case *NumericEqualitySubKPIDefinitionNode:
		subKPIDefinitionNodeEntities = append(subKPIDefinitionNodeEntities, SubKPIDefinitionNodeEntity{
			Node:                         currentNodeEntity,
			DeviceParameterSpecification: typedNode.DeviceParameterSpecification,
			Type:                         "numeric_equality",
			FirstNumericReferenceValue:   &typedNode.ReferenceValue,
			SecondNumericReferenceValue:  nil,
			StringReferenceValue:         nil,
			BooleanReferenceValue:        nil,
		})
	case *NumericInRangeSubKPIDefinitionNode:
		subKPIDefinitionNodeEntities = append(subKPIDefinitionNodeEntities, SubKPIDefinitionNodeEntity{
			Node:                         currentNodeEntity,
			DeviceParameterSpecification: typedNode.DeviceParameterSpecification,
			Type:                         "numeric_in_range",
			FirstNumericReferenceValue:   &typedNode.LowerBoundaryValue,
			SecondNumericReferenceValue:  &typedNode.UpperBoundaryValue,
			StringReferenceValue:         nil,
			BooleanReferenceValue:        nil,
		})
	case *BooleanEqualitySubKPIDefinitionNode:
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

func (r *relationalDatabaseClientImpl) insertRootKPIDefinitionIntoTheDatabase(rootKPIDefinition RootKPIDefinition) error {

	var err error

	genericKPINodeEntity, genericKPINodeEntities, logicalOperatorNodeEntities, subKPIDefinitionNodeEntities := transformKPIDefinitionTree(rootKPIDefinition.DefinitionRoot, nil, []*GenericKPINodeEntity{}, []LogicalOperatorNodeEntity{}, []SubKPIDefinitionNodeEntity{})

	rootKPIDefinitionEntity := RootKPIDefinitionEntity{
		DeviceTypeSpecification:  rootKPIDefinition.DeviceTypeSpecification,
		HumanReadableDescription: rootKPIDefinition.HumanReadableDescription,
		DefinitionRootNode:       genericKPINodeEntity,
	}

	for index, entity := range genericKPINodeEntities {
		err = r.db.Create(&entity).Error
		if err != nil {
			return err
		}
		genericKPINodeEntities[index] = entity
	}

	err = r.db.Create(&rootKPIDefinitionEntity).Error
	if err != nil {
		return err
	}

	for index, entity := range logicalOperatorNodeEntities {
		err = r.db.Create(&entity).Error
		if err != nil {
			return err
		}
		logicalOperatorNodeEntities[index] = entity
	}

	for index, entity := range subKPIDefinitionNodeEntities {
		err = r.db.Create(&entity).Error
		if err != nil {
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
		err := r.db.Where("parent_node_id = ?", topGenericKPINodeEntity.ID).Find(&nodes).Error
		if err != nil {
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

func (r *relationalDatabaseClientImpl) fetchRootKPIDefinitionEntities(targetDeviceType string) ([]RootKPIDefinitionEntity, error) {

	var err error
	var rootKPIDefinitionEntities []RootKPIDefinitionEntity

	err = r.db.Where("device_type_specification = ?", targetDeviceType).Find(&rootKPIDefinitionEntities).Error
	if err != nil {
		log.Println("Error loading data from database:", err)
		return nil, fmt.Errorf("error obtaining data from the '%s' table: %w", RootKPIDefinitionTableName, err)
	}

	return rootKPIDefinitionEntities, nil
}

func (r *relationalDatabaseClientImpl) fetchGenericKPINodeEntities(rootKPIDefinitionEntities []RootKPIDefinitionEntity) ([]GenericKPINodeEntity, error) {

	var err error
	var genericKPINodeEntities []GenericKPINodeEntity

	for _, rootKPIDefinitionEntity := range rootKPIDefinitionEntities {

		var rootGenericKPINodeEntity GenericKPINodeEntity
		err = r.db.Where("id = ?", rootKPIDefinitionEntity.DefinitionRootNodeID).First(&rootGenericKPINodeEntity).Error
		if err == nil {
			genericKPINodeEntities = append(genericKPINodeEntities, rootGenericKPINodeEntity)
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			log.Println("Error loading data from database:", err)
			return nil, fmt.Errorf("error obtaining data from the '%s' table: %w", GenericKPINodeTableName, err)
		}

		var topGenericKPINodeEntities []GenericKPINodeEntity
		err = r.db.Where("parent_node_id = ?", rootKPIDefinitionEntity.DefinitionRootNodeID).Find(&topGenericKPINodeEntities).Error
		if err != nil {
			log.Println("Error loading data from database:", err)
			return nil, fmt.Errorf("error obtaining data from the '%s' table: %w", GenericKPINodeTableName, err)
		}
		genericKPINodeEntities = append(genericKPINodeEntities, topGenericKPINodeEntities...)

		var allRemainingGenericKPINodeEntities []GenericKPINodeEntity
		allRemainingGenericKPINodeEntities, err = r.fetchRemainingGenericKPINodeEntities(topGenericKPINodeEntities)
		if err != nil {
			log.Println("Error loading data from database:", err)
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
				log.Println("Error loading data from database:", err)
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
				log.Println("Error loading data from database:", err)
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

func reconstructNodeTree(genericKPINodeEntity GenericKPINodeEntity, nodeChildrenMap map[uint32][]GenericKPINodeEntity, logicalOperatorNodeEntities []LogicalOperatorNodeEntity, subKPIDefinitionNodeEntities []SubKPIDefinitionNodeEntity) Node {

	for _, logicalOperatorNodeEntity := range logicalOperatorNodeEntities {

		logicalOperatorNodeEntityNodeID := *logicalOperatorNodeEntity.NodeID
		if logicalOperatorNodeEntityNodeID == genericKPINodeEntity.ID {

			childGenericKPINodeEntities := nodeChildrenMap[logicalOperatorNodeEntityNodeID]
			var childNodes []Node
			for _, childGenericKPINodeEntity := range childGenericKPINodeEntities {
				childNode := reconstructNodeTree(childGenericKPINodeEntity, nodeChildrenMap, logicalOperatorNodeEntities, subKPIDefinitionNodeEntities)
				childNodes = append(childNodes, childNode)
			}
			return &LogicalOperatorNode{
				Type:       logicalOperatorNodeEntity.Type,
				ChildNodes: childNodes,
			}
		}
	}

	for _, subKPIDefinitionNodeEntity := range subKPIDefinitionNodeEntities {
		if *subKPIDefinitionNodeEntity.NodeID == genericKPINodeEntity.ID {
			subKPIDefinitionBaseNode := SubKPIDefinitionBaseNode{
				DeviceParameterSpecification: subKPIDefinitionNodeEntity.DeviceParameterSpecification,
			}
			switch subKPIDefinitionNodeEntity.Type {
			case "string_equality":
				return &StringEqualitySubKPIDefinitionNode{
					SubKPIDefinitionBaseNode: subKPIDefinitionBaseNode,
					ReferenceValue:           *subKPIDefinitionNodeEntity.StringReferenceValue,
				}
			case "numeric_less_than":
				return &NumericLessThanSubKPIDefinitionNode{
					SubKPIDefinitionBaseNode: subKPIDefinitionBaseNode,
					ReferenceValue:           *subKPIDefinitionNodeEntity.FirstNumericReferenceValue,
				}
			case "numeric_greater_than":
				return &NumericGreaterThanSubKPIDefinitionNode{
					SubKPIDefinitionBaseNode: subKPIDefinitionBaseNode,
					ReferenceValue:           *subKPIDefinitionNodeEntity.FirstNumericReferenceValue,
				}
			case "numeric_equality":
				return &NumericEqualitySubKPIDefinitionNode{
					SubKPIDefinitionBaseNode: subKPIDefinitionBaseNode,
					ReferenceValue:           *subKPIDefinitionNodeEntity.FirstNumericReferenceValue,
				}
			case "numeric_in_range":
				return &NumericInRangeSubKPIDefinitionNode{
					SubKPIDefinitionBaseNode: subKPIDefinitionBaseNode,
					LowerBoundaryValue:       *subKPIDefinitionNodeEntity.FirstNumericReferenceValue,
					UpperBoundaryValue:       *subKPIDefinitionNodeEntity.SecondNumericReferenceValue,
				}
			case "boolean_equality":
				return &BooleanEqualitySubKPIDefinitionNode{
					SubKPIDefinitionBaseNode: subKPIDefinitionBaseNode,
					ReferenceValue:           *subKPIDefinitionNodeEntity.BooleanReferenceValue,
				}
			}
		}
	}

	return nil
}

func reconstructRootKPIDefinition(rootKPIDefinitionEntity RootKPIDefinitionEntity, genericKPINodeEntities []GenericKPINodeEntity, logicalOperatorNodeEntities []LogicalOperatorNodeEntity, subKPIDefinitionNodeEntities []SubKPIDefinitionNodeEntity) RootKPIDefinition {

	var definitionRoot Node
	nodeChildrenMap := prepareNodeChildrenMap(genericKPINodeEntities)

	for _, genericKPINodeEntity := range genericKPINodeEntities {
		if genericKPINodeEntity.ID == *rootKPIDefinitionEntity.DefinitionRootNodeID {
			definitionRoot = reconstructNodeTree(genericKPINodeEntity, nodeChildrenMap, logicalOperatorNodeEntities, subKPIDefinitionNodeEntities)
			break
		}
	}

	return RootKPIDefinition{
		DeviceTypeSpecification:  rootKPIDefinitionEntity.DeviceTypeSpecification,
		HumanReadableDescription: rootKPIDefinitionEntity.HumanReadableDescription,
		DefinitionRoot:           definitionRoot,
	}
}

func (r *relationalDatabaseClientImpl) ObtainRootKPIDefinitionsForTheGivenDeviceType(targetDeviceType string) ([]RootKPIDefinition, error) {

	var err error

	var rootKPIDefinitionEntities []RootKPIDefinitionEntity
	rootKPIDefinitionEntities, err = r.fetchRootKPIDefinitionEntities(targetDeviceType)
	if err != nil {
		return nil, err
	}

	var genericKPINodeEntities []GenericKPINodeEntity
	genericKPINodeEntities, err = r.fetchGenericKPINodeEntities(rootKPIDefinitionEntities)
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

	var rootKPIDefinitions []RootKPIDefinition
	for _, rootKPIDefinitionEntity := range rootKPIDefinitionEntities {
		rootKPIDefinition := reconstructRootKPIDefinition(rootKPIDefinitionEntity, genericKPINodeEntities, logicalOperatorNodeEntities, subKPIDefinitionNodeEntities)
		rootKPIDefinitions = append(rootKPIDefinitions, rootKPIDefinition)
	}

	return rootKPIDefinitions, nil
}

func (r *relationalDatabaseClientImpl) ObtainUserDefinedDeviceTypeByID(id uint32) (UserDefinedDeviceTypesEntity, error) {

	var userDefinedDeviceTypesEntity UserDefinedDeviceTypesEntity
	err := r.db.Preload("Parameters").Where("id = ?", id).First(&userDefinedDeviceTypesEntity).Error

	return userDefinedDeviceTypesEntity, err
}
