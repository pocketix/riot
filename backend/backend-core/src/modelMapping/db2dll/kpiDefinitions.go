package db2dll

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedUtils"
)

func reconstructKPINodeTree(currentKPINodeID uint32, kpiNodeParentChildrenMap map[uint32][]uint32, logicalOperationKPINodeEntities []dbModel.LogicalOperationKPINodeEntity, atomKPINodeEntities []dbModel.AtomKPINodeEntity) sharedModel.KPINode {
	logicalOperationKPINodeEntityOptional := sharedUtils.FindFirst(logicalOperationKPINodeEntities, func(logicalOperationKPINodeEntity dbModel.LogicalOperationKPINodeEntity) bool {
		return *logicalOperationKPINodeEntity.NodeID == currentKPINodeID
	})
	if logicalOperationKPINodeEntityOptional.IsPresent() {
		logicalOperationKPINodeEntity := logicalOperationKPINodeEntityOptional.GetPayload()
		childNodeIDs := kpiNodeParentChildrenMap[*logicalOperationKPINodeEntity.NodeID]
		childNodes := make([]sharedModel.KPINode, 0)
		sharedUtils.ForEach(childNodeIDs, func(childNodeID uint32) {
			childNodes = append(childNodes, reconstructKPINodeTree(childNodeID, kpiNodeParentChildrenMap, logicalOperationKPINodeEntities, atomKPINodeEntities))
		})
		return &sharedModel.LogicalOperationKPINode{
			Type:       sharedModel.LogicalOperationNodeType(logicalOperationKPINodeEntity.Type),
			ChildNodes: childNodes,
		}
	}
	atomKPINodeEntityOptional := sharedUtils.FindFirst(atomKPINodeEntities, func(atomKPINodeEntity dbModel.AtomKPINodeEntity) bool {
		return *atomKPINodeEntity.NodeID == currentKPINodeID
	})
	if atomKPINodeEntityOptional.IsPresent() {
		atomKPINodeEntity := atomKPINodeEntityOptional.GetPayload()
		sdParameterID := atomKPINodeEntity.SDParameter.ID
		sdParameterDenotation := atomKPINodeEntity.SDParameter.Denotation
		switch atomKPINodeEntity.Type {
		case "string_eq":
			return &sharedModel.StringEQAtomKPINode{
				SDParameterID:            sdParameterID,
				SDParameterSpecification: sdParameterDenotation,
				ReferenceValue:           sharedUtils.NewOptionalFromPointer(atomKPINodeEntity.StringReferenceValue).GetPayload(),
			}
		case "boolean_eq":
			return &sharedModel.BooleanEQAtomKPINode{
				SDParameterID:            sdParameterID,
				SDParameterSpecification: sdParameterDenotation,
				ReferenceValue:           sharedUtils.NewOptionalFromPointer(atomKPINodeEntity.BooleanReferenceValue).GetPayload(),
			}
		case "numeric_eq":
			return &sharedModel.NumericEQAtomKPINode{
				SDParameterID:            sdParameterID,
				SDParameterSpecification: sdParameterDenotation,
				ReferenceValue:           sharedUtils.NewOptionalFromPointer(atomKPINodeEntity.NumericReferenceValue).GetPayload(),
			}
		case "numeric_lt":
			return &sharedModel.NumericLTAtomKPINode{
				SDParameterID:            sdParameterID,
				SDParameterSpecification: sdParameterDenotation,
				ReferenceValue:           sharedUtils.NewOptionalFromPointer(atomKPINodeEntity.NumericReferenceValue).GetPayload(),
			}
		case "numeric_leq":
			return &sharedModel.NumericLEQAtomKPINode{
				SDParameterID:            sdParameterID,
				SDParameterSpecification: sdParameterDenotation,
				ReferenceValue:           sharedUtils.NewOptionalFromPointer(atomKPINodeEntity.NumericReferenceValue).GetPayload(),
			}
		case "numeric_gt":
			return &sharedModel.NumericGTAtomKPINode{
				SDParameterID:            sdParameterID,
				SDParameterSpecification: sdParameterDenotation,
				ReferenceValue:           sharedUtils.NewOptionalFromPointer(atomKPINodeEntity.NumericReferenceValue).GetPayload(),
			}
		case "numeric_geq":
			return &sharedModel.NumericGEQAtomKPINode{
				SDParameterID:            sdParameterID,
				SDParameterSpecification: sdParameterDenotation,
				ReferenceValue:           sharedUtils.NewOptionalFromPointer(atomKPINodeEntity.NumericReferenceValue).GetPayload(),
			}
		}
	}
	panic(fmt.Errorf("unpexted model mapping failure – shouldn't happen"))
}

func prepareKPINodeParentChildrenMap(kpiNodeEntities []dbModel.KPINodeEntity) map[uint32][]uint32 {
	kpiNodeParentChildrenMap := make(map[uint32][]uint32)
	for _, kpiNodeEntity := range kpiNodeEntities {
		sharedUtils.NewOptionalFromPointer(kpiNodeEntity.ParentNodeID).DoIfPresent(func(parentNodeID uint32) {
			kpiNodeParentChildrenMap[parentNodeID] = append(kpiNodeParentChildrenMap[parentNodeID], kpiNodeEntity.ID)
		})
	}
	return kpiNodeParentChildrenMap
}

func ToDLLModelKPIDefinition(kpiDefinitionEntity dbModel.KPIDefinitionEntity, kpiNodeEntities []dbModel.KPINodeEntity, logicalOperationKPINodeEntities []dbModel.LogicalOperationKPINodeEntity, atomKPINodeEntities []dbModel.AtomKPINodeEntity) sharedModel.KPIDefinition {
	kpiDefinitionRootOptional := sharedUtils.NewOptionalOf(reconstructKPINodeTree(*kpiDefinitionEntity.RootNodeID, prepareKPINodeParentChildrenMap(kpiNodeEntities), logicalOperationKPINodeEntities, atomKPINodeEntities))
	return sharedModel.KPIDefinition{
		ID:                  &kpiDefinitionEntity.ID,
		SDTypeID:            kpiDefinitionEntity.SDTypeID,
		SDTypeSpecification: kpiDefinitionEntity.SDType.Denotation,
		UserIdentifier:      kpiDefinitionEntity.UserIdentifier,
		RootNode:            kpiDefinitionRootOptional.GetPayload(),
	}
}
