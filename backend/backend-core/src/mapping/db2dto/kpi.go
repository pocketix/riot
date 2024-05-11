package db2dto

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/schema"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/kpi"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func reconstructKPINodeTree(currentKPINodeID uint32, kpiNodeParentChildrenMap map[uint32][]uint32, logicalOperationKPINodeEntities []schema.LogicalOperationKPINodeEntity, atomKPINodeEntities []schema.AtomKPINodeEntity) kpi.NodeDTO {
	logicalOperationKPINodeEntityOptional := util.FindFirst(logicalOperationKPINodeEntities, func(logicalOperationKPINodeEntity schema.LogicalOperationKPINodeEntity) bool {
		return *logicalOperationKPINodeEntity.NodeID == currentKPINodeID
	})
	currentNodeIsLogicalOperationNode := logicalOperationKPINodeEntityOptional.IsPresent()
	if currentNodeIsLogicalOperationNode {
		logicalOperationKPINodeEntity := logicalOperationKPINodeEntityOptional.GetPayload()
		childNodeIDs := kpiNodeParentChildrenMap[*logicalOperationKPINodeEntity.NodeID]
		childNodes := make([]kpi.NodeDTO, 0)
		util.ForEach(childNodeIDs, func(childNodeID uint32) {
			childNodes = append(childNodes, reconstructKPINodeTree(childNodeID, kpiNodeParentChildrenMap, logicalOperationKPINodeEntities, atomKPINodeEntities))
		})
		return kpi.LogicalOperationNodeDTO{
			Type:       kpi.LogicalOperationNodeType(logicalOperationKPINodeEntity.Type),
			ChildNodes: childNodes,
		}
	}
	atomKPINodeEntityOptional := util.FindFirst(atomKPINodeEntities, func(atomKPINodeEntity schema.AtomKPINodeEntity) bool {
		return *atomKPINodeEntity.NodeID == currentKPINodeID
	})
	currentNodeIsAtomNode := atomKPINodeEntityOptional.IsPresent()
	if currentNodeIsAtomNode {
		atomKPINodeEntity := atomKPINodeEntityOptional.GetPayload()
		sdParameterID := atomKPINodeEntity.SDParameter.ID
		sdParameterDenotation := atomKPINodeEntity.SDParameter.Denotation
		switch atomKPINodeEntity.Type {
		case "string_eq":
			return kpi.EQAtomNodeDTO[string]{
				SDParameterID:            sdParameterID,
				SDParameterSpecification: sdParameterDenotation,
				ReferenceValue:           util.NewOptionalFromPointer(atomKPINodeEntity.StringReferenceValue).GetPayload(),
			}
		case "boolean_eq":
			return kpi.EQAtomNodeDTO[bool]{
				SDParameterID:            sdParameterID,
				SDParameterSpecification: sdParameterDenotation,
				ReferenceValue:           util.NewOptionalFromPointer(atomKPINodeEntity.BooleanReferenceValue).GetPayload(),
			}
		case "numeric_eq":
			return kpi.EQAtomNodeDTO[float64]{
				SDParameterID:            sdParameterID,
				SDParameterSpecification: sdParameterDenotation,
				ReferenceValue:           util.NewOptionalFromPointer(atomKPINodeEntity.NumericReferenceValue).GetPayload(),
			}
		case "numeric_lt":
			return kpi.NumericLTAtomNodeDTO{
				SDParameterID:            sdParameterID,
				SDParameterSpecification: sdParameterDenotation,
				ReferenceValue:           util.NewOptionalFromPointer(atomKPINodeEntity.NumericReferenceValue).GetPayload(),
			}
		case "numeric_leq":
			return kpi.NumericLEQAtomNodeDTO{
				SDParameterID:            sdParameterID,
				SDParameterSpecification: sdParameterDenotation,
				ReferenceValue:           util.NewOptionalFromPointer(atomKPINodeEntity.NumericReferenceValue).GetPayload(),
			}
		case "numeric_gt":
			return kpi.NumericGTAtomNodeDTO{
				SDParameterID:            sdParameterID,
				SDParameterSpecification: sdParameterDenotation,
				ReferenceValue:           util.NewOptionalFromPointer(atomKPINodeEntity.NumericReferenceValue).GetPayload(),
			}
		case "numeric_geq":
			return kpi.NumericGEQAtomNodeDTO{
				SDParameterID:            sdParameterID,
				SDParameterSpecification: sdParameterDenotation,
				ReferenceValue:           util.NewOptionalFromPointer(atomKPINodeEntity.NumericReferenceValue).GetPayload(),
			}
		}
	}
	if currentNodeIsLogicalOperationNode {
		panic(fmt.Sprintf("current node (ID: %d) found among logical operation KPI node entities, but the KPI node tree reconstruction still failed", currentKPINodeID))
	} else if currentNodeIsAtomNode {
		panic(fmt.Sprintf("current node (ID: %d) found among atom KPI node entities, but the KPI node tree reconstruction still failed", currentKPINodeID))
	} else {
		panic(fmt.Sprintf("current node (ID: %d) not found among logical operation KPI node entities, nor atom KPI node entities", currentKPINodeID))
	}
}

func prepareKPINodeParentChildrenMap(kpiNodeEntities []schema.KPINodeEntity) map[uint32][]uint32 {
	kpiNodeParentChildrenMap := make(map[uint32][]uint32)
	for _, kpiNodeEntity := range kpiNodeEntities {
		util.NewOptionalFromPointer(kpiNodeEntity.ParentNodeID).DoIfPresent(func(parentNodeID uint32) {
			kpiNodeParentChildrenMap[parentNodeID] = append(kpiNodeParentChildrenMap[parentNodeID], kpiNodeEntity.ID)
		})
	}
	return kpiNodeParentChildrenMap
}

func ReconstructKPIDefinitionDTO(kpiDefinitionEntity schema.KPIDefinitionEntity, kpiNodeEntities []schema.KPINodeEntity, logicalOperationKPINodeEntities []schema.LogicalOperationKPINodeEntity, atomKPINodeEntities []schema.AtomKPINodeEntity) kpi.DefinitionDTO {
	kpiDefinitionRootOptional := util.NewOptionalOf(reconstructKPINodeTree(*kpiDefinitionEntity.RootNodeID, prepareKPINodeParentChildrenMap(kpiNodeEntities), logicalOperationKPINodeEntities, atomKPINodeEntities))
	return kpi.DefinitionDTO{
		ID:                  util.NewOptionalOf[uint32](kpiDefinitionEntity.ID),
		SDTypeID:            kpiDefinitionEntity.SDTypeID,
		SDTypeSpecification: kpiDefinitionEntity.SDType.Denotation,
		UserIdentifier:      kpiDefinitionEntity.UserIdentifier,
		RootNode:            kpiDefinitionRootOptional.GetPayload(),
	}
}
