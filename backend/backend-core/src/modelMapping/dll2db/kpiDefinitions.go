package dll2db

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedModel"
)

func ToDBModelEntitiesKPIDefinition(kpiDefinition sharedModel.KPIDefinition) (*dbModel.KPINodeEntity, []*dbModel.KPINodeEntity, []dbModel.LogicalOperationKPINodeEntity, []dbModel.AtomKPINodeEntity) {
	return transformKPIDefinitionTree(kpiDefinition.RootNode, nil, make([]*dbModel.KPINodeEntity, 0), make([]dbModel.LogicalOperationKPINodeEntity, 0), make([]dbModel.AtomKPINodeEntity, 0))
}

func transformKPIDefinitionTree(node sharedModel.KPINode, parentKPINodeEntity *dbModel.KPINodeEntity, kpiNodeEntities []*dbModel.KPINodeEntity, logicalOperationNodeEntities []dbModel.LogicalOperationKPINodeEntity, atomNodeEntities []dbModel.AtomKPINodeEntity) (*dbModel.KPINodeEntity, []*dbModel.KPINodeEntity, []dbModel.LogicalOperationKPINodeEntity, []dbModel.AtomKPINodeEntity) {
	currentNodeEntity := &dbModel.KPINodeEntity{
		ParentNode: parentKPINodeEntity,
	}
	kpiNodeEntities = append(kpiNodeEntities, currentNodeEntity)
	switch typedNode := node.(type) {
	case *sharedModel.LogicalOperationKPINode:
		logicalOperationNodeEntities = append(logicalOperationNodeEntities, dbModel.LogicalOperationKPINodeEntity{
			Node: currentNodeEntity,
			Type: string(typedNode.Type),
		})
		for _, childNode := range typedNode.ChildNodes {
			_, kpiNodeEntities, logicalOperationNodeEntities, atomNodeEntities = transformKPIDefinitionTree(childNode, currentNodeEntity, kpiNodeEntities, logicalOperationNodeEntities, atomNodeEntities)
		}
	case *sharedModel.StringEQAtomKPINode:
		atomNodeEntities = append(atomNodeEntities, dbModel.AtomKPINodeEntity{
			Node:                 currentNodeEntity,
			SDParameterID:        typedNode.SDParameterID,
			Type:                 "string_eq",
			StringReferenceValue: &typedNode.ReferenceValue,
		})
	case *sharedModel.BooleanEQAtomKPINode:
		atomNodeEntities = append(atomNodeEntities, dbModel.AtomKPINodeEntity{
			Node:                  currentNodeEntity,
			SDParameterID:         typedNode.SDParameterID,
			Type:                  "boolean_eq",
			BooleanReferenceValue: &typedNode.ReferenceValue,
		})
	case *sharedModel.NumericEQAtomKPINode:
		atomNodeEntities = append(atomNodeEntities, dbModel.AtomKPINodeEntity{
			Node:                  currentNodeEntity,
			SDParameterID:         typedNode.SDParameterID,
			Type:                  "numeric_eq",
			NumericReferenceValue: &typedNode.ReferenceValue,
		})
	case *sharedModel.NumericLTAtomKPINode:
		atomNodeEntities = append(atomNodeEntities, dbModel.AtomKPINodeEntity{
			Node:                  currentNodeEntity,
			SDParameterID:         typedNode.SDParameterID,
			Type:                  "numeric_lt",
			NumericReferenceValue: &typedNode.ReferenceValue,
		})
	case *sharedModel.NumericLEQAtomKPINode:
		atomNodeEntities = append(atomNodeEntities, dbModel.AtomKPINodeEntity{
			Node:                  currentNodeEntity,
			SDParameterID:         typedNode.SDParameterID,
			Type:                  "numeric_leq",
			NumericReferenceValue: &typedNode.ReferenceValue,
		})
	case *sharedModel.NumericGTAtomKPINode:
		atomNodeEntities = append(atomNodeEntities, dbModel.AtomKPINodeEntity{
			Node:                  currentNodeEntity,
			SDParameterID:         typedNode.SDParameterID,
			Type:                  "numeric_gt",
			NumericReferenceValue: &typedNode.ReferenceValue,
		})
	case *sharedModel.NumericGEQAtomKPINode:
		atomNodeEntities = append(atomNodeEntities, dbModel.AtomKPINodeEntity{
			Node:                  currentNodeEntity,
			SDParameterID:         typedNode.SDParameterID,
			Type:                  "numeric_geq",
			NumericReferenceValue: &typedNode.ReferenceValue,
		})
	}
	return currentNodeEntity, kpiNodeEntities, logicalOperationNodeEntities, atomNodeEntities
}
