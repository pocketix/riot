package db2dto

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/schema"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/kpi"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func reconstructNodeTree(kpiNodeEntity schema.KPINodeEntity, nodeChildrenMap map[uint32][]schema.KPINodeEntity, logicalOperationKPINodeEntities []schema.LogicalOperationKPINodeEntity, atomKPINodeEntities []schema.AtomKPINodeEntity) kpi.NodeDTO {
	for _, logicalOperationKPINodeEntity := range logicalOperationKPINodeEntities {
		logicalOperationKPINodeEntityNodeId := *logicalOperationKPINodeEntity.NodeID
		if logicalOperationKPINodeEntityNodeId == kpiNodeEntity.ID {
			childKPINodeEntities := nodeChildrenMap[logicalOperationKPINodeEntityNodeId]
			var childNodes []kpi.NodeDTO
			for _, childGenericKPINodeEntity := range childKPINodeEntities {
				childNode := reconstructNodeTree(childGenericKPINodeEntity, nodeChildrenMap, logicalOperationKPINodeEntities, atomKPINodeEntities)
				childNodes = append(childNodes, childNode)
			}
			return kpi.LogicalOperationNodeDTO{
				Type:       kpi.LogicalOperationNodeType(logicalOperationKPINodeEntity.Type),
				ChildNodes: childNodes,
			}
		}
	}
	for _, atomKPINodeEntity := range atomKPINodeEntities {
		if *atomKPINodeEntity.NodeID == kpiNodeEntity.ID {
			switch atomKPINodeEntity.Type {
			case "string_eq":
				return kpi.EQAtomNodeDTO[string]{
					SDParameterSpecification: atomKPINodeEntity.SDParameterSpecification,
					ReferenceValue:           *atomKPINodeEntity.StringReferenceValue,
				}
			case "boolean_eq":
				return kpi.EQAtomNodeDTO[bool]{
					SDParameterSpecification: atomKPINodeEntity.SDParameterSpecification,
					ReferenceValue:           *atomKPINodeEntity.BooleanReferenceValue,
				}
			case "numeric_eq":
				return kpi.EQAtomNodeDTO[float64]{
					SDParameterSpecification: atomKPINodeEntity.SDParameterSpecification,
					ReferenceValue:           *atomKPINodeEntity.NumericReferenceValue,
				}
			case "numeric_lt":
				return kpi.NumericLTAtomNodeDTO{
					SDParameterSpecification: atomKPINodeEntity.SDParameterSpecification,
					ReferenceValue:           *atomKPINodeEntity.NumericReferenceValue,
				}
			case "numeric_leq":
				return kpi.NumericLEQAtomNodeDTO{
					SDParameterSpecification: atomKPINodeEntity.SDParameterSpecification,
					ReferenceValue:           *atomKPINodeEntity.NumericReferenceValue,
				}
			case "numeric_gt":
				return kpi.NumericGTAtomNodeDTO{
					SDParameterSpecification: atomKPINodeEntity.SDParameterSpecification,
					ReferenceValue:           *atomKPINodeEntity.NumericReferenceValue,
				}
			case "numeric_geq":
				return kpi.NumericGEQAtomNodeDTO{
					SDParameterSpecification: atomKPINodeEntity.SDParameterSpecification,
					ReferenceValue:           *atomKPINodeEntity.NumericReferenceValue,
				}
			}
		}
	}
	panic("Failed trying to transform KPI definition(s) from DB format do DTO format... shouldn't happen")
}

func prepareNodeChildrenMap(kpiNodeEntities []schema.KPINodeEntity) map[uint32][]schema.KPINodeEntity {
	nodeChildrenMap := make(map[uint32][]schema.KPINodeEntity)
	for _, kpiNodeEntity := range kpiNodeEntities {
		if kpiNodeEntity.ParentNodeID != nil {
			parentNodeID := *kpiNodeEntity.ParentNodeID
			nodeChildrenMap[parentNodeID] = append(nodeChildrenMap[parentNodeID], kpiNodeEntity)
		}
	}
	return nodeChildrenMap
}

func ReconstructKPIDefinitionDTO(kpiDefinitionEntity schema.KPIDefinitionEntity, kpiNodeEntities []schema.KPINodeEntity, logicalOperationKPINodeEntities []schema.LogicalOperationKPINodeEntity, atomKPINodeEntities []schema.AtomKPINodeEntity) kpi.DefinitionDTO {
	var definitionRoot kpi.NodeDTO
	nodeChildrenMap := prepareNodeChildrenMap(kpiNodeEntities)
	for _, kpiNodeEntity := range kpiNodeEntities {
		if kpiNodeEntity.ID == *kpiDefinitionEntity.RootNodeID {
			definitionRoot = reconstructNodeTree(kpiNodeEntity, nodeChildrenMap, logicalOperationKPINodeEntities, atomKPINodeEntities)
			break
		}
	}
	return kpi.DefinitionDTO{
		ID:                  util.NewOptionalOf[uint32](kpiDefinitionEntity.ID),
		SDTypeSpecification: kpiDefinitionEntity.SDTypeSpecification,
		UserIdentifier:      kpiDefinitionEntity.UserIdentifier,
		RootNode:            definitionRoot,
	}
}
