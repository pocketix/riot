package dto2db

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/dbSchema"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/kpi"
)

func TransformKPIDefinitionTree(node kpi.NodeDTO, parentKPINodeEntity *dbSchema.KPINodeEntity, kpiNodeEntities []*dbSchema.KPINodeEntity, logicalOperationNodeEntities []dbSchema.LogicalOperationKPINodeEntity, atomNodeEntities []dbSchema.AtomKPINodeEntity) (*dbSchema.KPINodeEntity, []*dbSchema.KPINodeEntity, []dbSchema.LogicalOperationKPINodeEntity, []dbSchema.AtomKPINodeEntity) {
	currentNodeEntity := &dbSchema.KPINodeEntity{
		ParentNode: parentKPINodeEntity,
	}
	kpiNodeEntities = append(kpiNodeEntities, currentNodeEntity)
	switch typedNode := node.(type) {
	case kpi.LogicalOperationNodeDTO:
		logicalOperationNodeEntities = append(logicalOperationNodeEntities, dbSchema.LogicalOperationKPINodeEntity{
			Node: currentNodeEntity,
			Type: string(typedNode.Type),
		})
		for _, childNode := range typedNode.ChildNodes {
			_, kpiNodeEntities, logicalOperationNodeEntities, atomNodeEntities = TransformKPIDefinitionTree(childNode, currentNodeEntity, kpiNodeEntities, logicalOperationNodeEntities, atomNodeEntities)
		}
	case kpi.EQAtomNodeDTO[string]:
		atomNodeEntities = append(atomNodeEntities, dbSchema.AtomKPINodeEntity{
			Node:                 currentNodeEntity,
			SDParameterID:        typedNode.SDParameterID,
			Type:                 "string_eq",
			StringReferenceValue: &typedNode.ReferenceValue,
		})
	case kpi.EQAtomNodeDTO[bool]:
		atomNodeEntities = append(atomNodeEntities, dbSchema.AtomKPINodeEntity{
			Node:                  currentNodeEntity,
			SDParameterID:         typedNode.SDParameterID,
			Type:                  "boolean_eq",
			BooleanReferenceValue: &typedNode.ReferenceValue,
		})
	case kpi.EQAtomNodeDTO[float64]:
		atomNodeEntities = append(atomNodeEntities, dbSchema.AtomKPINodeEntity{
			Node:                  currentNodeEntity,
			SDParameterID:         typedNode.SDParameterID,
			Type:                  "numeric_eq",
			NumericReferenceValue: &typedNode.ReferenceValue,
		})
	case kpi.NumericLTAtomNodeDTO:
		atomNodeEntities = append(atomNodeEntities, dbSchema.AtomKPINodeEntity{
			Node:                  currentNodeEntity,
			SDParameterID:         typedNode.SDParameterID,
			Type:                  "numeric_lt",
			NumericReferenceValue: &typedNode.ReferenceValue,
		})
	case kpi.NumericLEQAtomNodeDTO:
		atomNodeEntities = append(atomNodeEntities, dbSchema.AtomKPINodeEntity{
			Node:                  currentNodeEntity,
			SDParameterID:         typedNode.SDParameterID,
			Type:                  "numeric_leq",
			NumericReferenceValue: &typedNode.ReferenceValue,
		})
	case kpi.NumericGTAtomNodeDTO:
		atomNodeEntities = append(atomNodeEntities, dbSchema.AtomKPINodeEntity{
			Node:                  currentNodeEntity,
			SDParameterID:         typedNode.SDParameterID,
			Type:                  "numeric_gt",
			NumericReferenceValue: &typedNode.ReferenceValue,
		})
	case kpi.NumericGEQAtomNodeDTO:
		atomNodeEntities = append(atomNodeEntities, dbSchema.AtomKPINodeEntity{
			Node:                  currentNodeEntity,
			SDParameterID:         typedNode.SDParameterID,
			Type:                  "numeric_geq",
			NumericReferenceValue: &typedNode.ReferenceValue,
		})
	}
	return currentNodeEntity, kpiNodeEntities, logicalOperationNodeEntities, atomNodeEntities
}
