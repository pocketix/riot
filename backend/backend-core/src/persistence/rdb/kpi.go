package rdb

import (
	"bp-bures-SfPDfSD/src/dto"
	"bp-bures-SfPDfSD/src/persistence/rdb/schema"
	"errors"
	"fmt"
	"gorm.io/gorm"
	"log"
)

func (r *relationalDatabaseClientImpl) fetchRemainingGenericKPINodeEntities(topGenericKPINodeEntities []schema.GenericKPINodeEntity) ([]schema.GenericKPINodeEntity, error) {

	var allNodes []schema.GenericKPINodeEntity
	for _, topGenericKPINodeEntity := range topGenericKPINodeEntities {

		var nodes []schema.GenericKPINodeEntity
		if err := r.db.Where("parent_node_id = ?", topGenericKPINodeEntity.ID).Find(&nodes).Error; err != nil {
			return nil, err
		}

		for _, node := range nodes {
			allNodes = append(allNodes, node)
			childNodes, err := r.fetchRemainingGenericKPINodeEntities([]schema.GenericKPINodeEntity{node})
			if err != nil {
				return nil, err
			}
			allNodes = append(allNodes, childNodes...)
		}
	}
	return allNodes, nil
}

func (r *relationalDatabaseClientImpl) fetchKPIDefinitionEntities(targetDeviceType string) ([]schema.KPIDefinitionEntity, error) {

	var err error
	var kpiDefinitionEntities []schema.KPIDefinitionEntity

	err = r.db.Where("device_type_specification = ?", targetDeviceType).Find(&kpiDefinitionEntities).Error
	if err != nil {
		log.Println("Error loading data from rdb:", err)
		return nil, fmt.Errorf("error obtaining data from the '%s' table: %w", schema.KPIDefinitionTableName, err)
	}

	return kpiDefinitionEntities, nil
}

func (r *relationalDatabaseClientImpl) fetchGenericKPINodeEntities(kpiDefinitionEntities []schema.KPIDefinitionEntity) ([]schema.GenericKPINodeEntity, error) {

	var err error
	var genericKPINodeEntities []schema.GenericKPINodeEntity

	for _, kpiDefinitionEntity := range kpiDefinitionEntities {

		var rootGenericKPINodeEntity schema.GenericKPINodeEntity
		err = r.db.Where("id = ?", kpiDefinitionEntity.DefinitionRootNodeID).First(&rootGenericKPINodeEntity).Error
		if err == nil {
			genericKPINodeEntities = append(genericKPINodeEntities, rootGenericKPINodeEntity)
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			log.Println("Error loading data from rdb:", err)
			return nil, fmt.Errorf("error obtaining data from the '%s' table: %w", schema.GenericKPINodeTableName, err)
		}

		var topGenericKPINodeEntities []schema.GenericKPINodeEntity
		err = r.db.Where("parent_node_id = ?", kpiDefinitionEntity.DefinitionRootNodeID).Find(&topGenericKPINodeEntities).Error
		if err != nil {
			log.Println("Error loading data from rdb:", err)
			return nil, fmt.Errorf("error obtaining data from the '%s' table: %w", schema.GenericKPINodeTableName, err)
		}
		genericKPINodeEntities = append(genericKPINodeEntities, topGenericKPINodeEntities...)

		var allRemainingGenericKPINodeEntities []schema.GenericKPINodeEntity
		allRemainingGenericKPINodeEntities, err = r.fetchRemainingGenericKPINodeEntities(topGenericKPINodeEntities)
		if err != nil {
			log.Println("Error loading data from rdb:", err)
			return nil, fmt.Errorf("error obtaining data from the '%s' table: %w", schema.GenericKPINodeTableName, err)
		}
		genericKPINodeEntities = append(genericKPINodeEntities, allRemainingGenericKPINodeEntities...)
	}

	return genericKPINodeEntities, nil
}

func (r *relationalDatabaseClientImpl) fetchLogicalOperatorNodeEntities(genericKPINodeEntities []schema.GenericKPINodeEntity) ([]schema.LogicalOperatorNodeEntity, error) { // TODO: One could most-likely merge fetchLogicalOperatorNodeEntities and fetchSubKPIDefinitionNodeEntities using generics or common interface...

	var err error
	var logicalOperatorNodeEntities []schema.LogicalOperatorNodeEntity

	for _, genericKPINodeEntity := range genericKPINodeEntities {
		var logicalOperatorNodeEntity schema.LogicalOperatorNodeEntity
		err = r.db.Where("node_id = ?", genericKPINodeEntity.ID).First(&logicalOperatorNodeEntity).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				continue
			} else {
				log.Println("Error loading data from rdb:", err)
				return nil, fmt.Errorf("error obtaining data from the '%s' table: %w", schema.LogicalOperatorNodeTableName, err)
			}
		}
		logicalOperatorNodeEntities = append(logicalOperatorNodeEntities, logicalOperatorNodeEntity)
	}

	return logicalOperatorNodeEntities, nil
}

func (r *relationalDatabaseClientImpl) fetchSubKPIDefinitionNodeEntities(genericKPINodeEntities []schema.GenericKPINodeEntity) ([]schema.SubKPIDefinitionNodeEntity, error) {

	var err error
	var subKPIDefinitionNodeEntities []schema.SubKPIDefinitionNodeEntity

	for _, genericKPINodeEntity := range genericKPINodeEntities {
		var subKPIDefinitionNodeEntity schema.SubKPIDefinitionNodeEntity
		err = r.db.Where("node_id = ?", genericKPINodeEntity.ID).First(&subKPIDefinitionNodeEntity).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				continue
			} else {
				log.Println("Error loading data from rdb:", err)
				return nil, fmt.Errorf("error obtaining data from the '%s' table: %w", schema.SubKPIDefinitionNodeTableName, err)
			}
		}
		subKPIDefinitionNodeEntities = append(subKPIDefinitionNodeEntities, subKPIDefinitionNodeEntity)
	}

	return subKPIDefinitionNodeEntities, nil
}

func prepareNodeChildrenMap(genericKPINodeEntities []schema.GenericKPINodeEntity) map[uint32][]schema.GenericKPINodeEntity {

	nodeChildrenMap := make(map[uint32][]schema.GenericKPINodeEntity)
	for _, genericKPINodeEntity := range genericKPINodeEntities {
		if genericKPINodeEntity.ParentNodeID != nil {
			parentNodeID := *genericKPINodeEntity.ParentNodeID
			nodeChildrenMap[parentNodeID] = append(nodeChildrenMap[parentNodeID], genericKPINodeEntity)
		}
	}
	return nodeChildrenMap
}

func reconstructNodeTree(genericKPINodeEntity schema.GenericKPINodeEntity, nodeChildrenMap map[uint32][]schema.GenericKPINodeEntity, logicalOperatorNodeEntities []schema.LogicalOperatorNodeEntity, subKPIDefinitionNodeEntities []schema.SubKPIDefinitionNodeEntity) dto.FulfillableNode {

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

func reconstructKPIDefinition(kpiDefinitionEntity schema.KPIDefinitionEntity, genericKPINodeEntities []schema.GenericKPINodeEntity, logicalOperatorNodeEntities []schema.LogicalOperatorNodeEntity, subKPIDefinitionNodeEntities []schema.SubKPIDefinitionNodeEntity) dto.KPIDefinitionDTO {

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

func transformKPIDefinitionTree(
	node dto.FulfillableNode,
	parentGenericKPINodeEntity *schema.GenericKPINodeEntity,
	genericKPINodeEntities []*schema.GenericKPINodeEntity,
	logicalOperatorNodeEntities []schema.LogicalOperatorNodeEntity,
	subKPIDefinitionNodeEntities []schema.SubKPIDefinitionNodeEntity,
) (
	*schema.GenericKPINodeEntity,
	[]*schema.GenericKPINodeEntity,
	[]schema.LogicalOperatorNodeEntity,
	[]schema.SubKPIDefinitionNodeEntity,
) {

	currentNodeEntity := &schema.GenericKPINodeEntity{
		ParentNode: parentGenericKPINodeEntity,
	}
	genericKPINodeEntities = append(genericKPINodeEntities, currentNodeEntity)

	switch typedNode := node.(type) {
	case *dto.LogicalOperatorNodeDTO:
		logicalOperatorNodeEntities = append(logicalOperatorNodeEntities, schema.LogicalOperatorNodeEntity{
			Node: currentNodeEntity,
			Type: string(typedNode.Type),
		})
		for _, childNode := range typedNode.ChildNodes {
			_, genericKPINodeEntities, logicalOperatorNodeEntities, subKPIDefinitionNodeEntities = transformKPIDefinitionTree(childNode, currentNodeEntity, genericKPINodeEntities, logicalOperatorNodeEntities, subKPIDefinitionNodeEntities)
		}
	case *dto.StringEqualitySubKPIDefinitionNodeDTO:
		subKPIDefinitionNodeEntities = append(subKPIDefinitionNodeEntities, schema.SubKPIDefinitionNodeEntity{
			Node:                         currentNodeEntity,
			DeviceParameterSpecification: typedNode.DeviceParameterSpecification,
			Type:                         "string_equality",
			FirstNumericReferenceValue:   nil,
			SecondNumericReferenceValue:  nil,
			StringReferenceValue:         &typedNode.ReferenceValue,
			BooleanReferenceValue:        nil,
		})
	case *dto.NumericLessThanSubKPIDefinitionNodeDTO:
		subKPIDefinitionNodeEntities = append(subKPIDefinitionNodeEntities, schema.SubKPIDefinitionNodeEntity{
			Node:                         currentNodeEntity,
			DeviceParameterSpecification: typedNode.DeviceParameterSpecification,
			Type:                         "numeric_less_than",
			FirstNumericReferenceValue:   &typedNode.ReferenceValue,
			SecondNumericReferenceValue:  nil,
			StringReferenceValue:         nil,
			BooleanReferenceValue:        nil,
		})
	case *dto.NumericGreaterThanSubKPIDefinitionNodeDTO:
		subKPIDefinitionNodeEntities = append(subKPIDefinitionNodeEntities, schema.SubKPIDefinitionNodeEntity{
			Node:                         currentNodeEntity,
			DeviceParameterSpecification: typedNode.DeviceParameterSpecification,
			Type:                         "numeric_greater_than",
			FirstNumericReferenceValue:   &typedNode.ReferenceValue,
			SecondNumericReferenceValue:  nil,
			StringReferenceValue:         nil,
			BooleanReferenceValue:        nil,
		})
	case *dto.NumericEqualitySubKPIDefinitionNodeDTO:
		subKPIDefinitionNodeEntities = append(subKPIDefinitionNodeEntities, schema.SubKPIDefinitionNodeEntity{
			Node:                         currentNodeEntity,
			DeviceParameterSpecification: typedNode.DeviceParameterSpecification,
			Type:                         "numeric_equality",
			FirstNumericReferenceValue:   &typedNode.ReferenceValue,
			SecondNumericReferenceValue:  nil,
			StringReferenceValue:         nil,
			BooleanReferenceValue:        nil,
		})
	case *dto.NumericInRangeSubKPIDefinitionNodeDTO:
		subKPIDefinitionNodeEntities = append(subKPIDefinitionNodeEntities, schema.SubKPIDefinitionNodeEntity{
			Node:                         currentNodeEntity,
			DeviceParameterSpecification: typedNode.DeviceParameterSpecification,
			Type:                         "numeric_in_range",
			FirstNumericReferenceValue:   &typedNode.LowerBoundaryValue,
			SecondNumericReferenceValue:  &typedNode.UpperBoundaryValue,
			StringReferenceValue:         nil,
			BooleanReferenceValue:        nil,
		})
	case *dto.BooleanEqualitySubKPIDefinitionNodeDTO:
		subKPIDefinitionNodeEntities = append(subKPIDefinitionNodeEntities, schema.SubKPIDefinitionNodeEntity{
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
