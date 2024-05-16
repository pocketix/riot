package dll2db

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/kpi"
)

func TransformKPIDefinitionTree(node kpi.NodeDTO, parentKPINodeEntity *dbModel.KPINodeEntity, kpiNodeEntities []*dbModel.KPINodeEntity, logicalOperationNodeEntities []dbModel.LogicalOperationKPINodeEntity, atomNodeEntities []dbModel.AtomKPINodeEntity) (*dbModel.KPINodeEntity, []*dbModel.KPINodeEntity, []dbModel.LogicalOperationKPINodeEntity, []dbModel.AtomKPINodeEntity) {
	currentNodeEntity := &dbModel.KPINodeEntity{
		ParentNode: parentKPINodeEntity,
	}
	kpiNodeEntities = append(kpiNodeEntities, currentNodeEntity)
	switch typedNode := node.(type) {
	case kpi.LogicalOperationNodeDTO:
		logicalOperationNodeEntities = append(logicalOperationNodeEntities, dbModel.LogicalOperationKPINodeEntity{
			Node: currentNodeEntity,
			Type: string(typedNode.Type),
		})
		for _, childNode := range typedNode.ChildNodes {
			_, kpiNodeEntities, logicalOperationNodeEntities, atomNodeEntities = TransformKPIDefinitionTree(childNode, currentNodeEntity, kpiNodeEntities, logicalOperationNodeEntities, atomNodeEntities)
		}
	case kpi.EQAtomNodeDTO[string]:
		atomNodeEntities = append(atomNodeEntities, dbModel.AtomKPINodeEntity{
			Node:                 currentNodeEntity,
			SDParameterID:        typedNode.SDParameterID,
			Type:                 "string_eq",
			StringReferenceValue: &typedNode.ReferenceValue,
		})
	case kpi.EQAtomNodeDTO[bool]:
		atomNodeEntities = append(atomNodeEntities, dbModel.AtomKPINodeEntity{
			Node:                  currentNodeEntity,
			SDParameterID:         typedNode.SDParameterID,
			Type:                  "boolean_eq",
			BooleanReferenceValue: &typedNode.ReferenceValue,
		})
	case kpi.EQAtomNodeDTO[float64]:
		atomNodeEntities = append(atomNodeEntities, dbModel.AtomKPINodeEntity{
			Node:                  currentNodeEntity,
			SDParameterID:         typedNode.SDParameterID,
			Type:                  "numeric_eq",
			NumericReferenceValue: &typedNode.ReferenceValue,
		})
	case kpi.NumericLTAtomNodeDTO:
		atomNodeEntities = append(atomNodeEntities, dbModel.AtomKPINodeEntity{
			Node:                  currentNodeEntity,
			SDParameterID:         typedNode.SDParameterID,
			Type:                  "numeric_lt",
			NumericReferenceValue: &typedNode.ReferenceValue,
		})
	case kpi.NumericLEQAtomNodeDTO:
		atomNodeEntities = append(atomNodeEntities, dbModel.AtomKPINodeEntity{
			Node:                  currentNodeEntity,
			SDParameterID:         typedNode.SDParameterID,
			Type:                  "numeric_leq",
			NumericReferenceValue: &typedNode.ReferenceValue,
		})
	case kpi.NumericGTAtomNodeDTO:
		atomNodeEntities = append(atomNodeEntities, dbModel.AtomKPINodeEntity{
			Node:                  currentNodeEntity,
			SDParameterID:         typedNode.SDParameterID,
			Type:                  "numeric_gt",
			NumericReferenceValue: &typedNode.ReferenceValue,
		})
	case kpi.NumericGEQAtomNodeDTO:
		atomNodeEntities = append(atomNodeEntities, dbModel.AtomKPINodeEntity{
			Node:                  currentNodeEntity,
			SDParameterID:         typedNode.SDParameterID,
			Type:                  "numeric_geq",
			NumericReferenceValue: &typedNode.ReferenceValue,
		})
	}
	return currentNodeEntity, kpiNodeEntities, logicalOperationNodeEntities, atomNodeEntities
}
