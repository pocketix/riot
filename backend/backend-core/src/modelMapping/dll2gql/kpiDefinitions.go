package dll2gql

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func toGraphQLModelKPINode(kpiNode sharedModel.KPINode, id uint32, parentNodeID *uint32) graphQLModel.KPINode {
	switch typedKPINode := kpiNode.(type) {
	case *sharedModel.StringEQAtomKPINode:
		return graphQLModel.StringEQAtomKPINode{
			ID:                       id,
			ParentNodeID:             parentNodeID,
			NodeType:                 graphQLModel.KPINodeTypeStringEQAtom,
			SdParameterID:            typedKPINode.SDParameterID,
			SdParameterSpecification: typedKPINode.SDParameterSpecification,
			StringReferenceValue:     typedKPINode.ReferenceValue,
		}
	case *sharedModel.BooleanEQAtomKPINode:
		return graphQLModel.BooleanEQAtomKPINode{
			ID:                       id,
			ParentNodeID:             parentNodeID,
			NodeType:                 graphQLModel.KPINodeTypeBooleanEQAtom,
			SdParameterID:            typedKPINode.SDParameterID,
			SdParameterSpecification: typedKPINode.SDParameterSpecification,
			BooleanReferenceValue:    typedKPINode.ReferenceValue,
		}
	case *sharedModel.NumericEQAtomKPINode:
		return graphQLModel.NumericEQAtomKPINode{
			ID:                       id,
			ParentNodeID:             parentNodeID,
			NodeType:                 graphQLModel.KPINodeTypeNumericEQAtom,
			SdParameterID:            typedKPINode.SDParameterID,
			SdParameterSpecification: typedKPINode.SDParameterSpecification,
			NumericReferenceValue:    typedKPINode.ReferenceValue,
		}
	case *sharedModel.NumericLTAtomKPINode:
		return graphQLModel.NumericLTAtomKPINode{
			ID:                       id,
			ParentNodeID:             parentNodeID,
			NodeType:                 graphQLModel.KPINodeTypeNumericLTAtom,
			SdParameterID:            typedKPINode.SDParameterID,
			SdParameterSpecification: typedKPINode.SDParameterSpecification,
			NumericReferenceValue:    typedKPINode.ReferenceValue,
		}
	case *sharedModel.NumericLEQAtomKPINode:
		return graphQLModel.NumericLEQAtomKPINode{
			ID:                       id,
			ParentNodeID:             parentNodeID,
			NodeType:                 graphQLModel.KPINodeTypeNumericLEQAtom,
			SdParameterID:            typedKPINode.SDParameterID,
			SdParameterSpecification: typedKPINode.SDParameterSpecification,
			NumericReferenceValue:    typedKPINode.ReferenceValue,
		}
	case *sharedModel.NumericGTAtomKPINode:
		return graphQLModel.NumericGTAtomKPINode{
			ID:                       id,
			ParentNodeID:             parentNodeID,
			NodeType:                 graphQLModel.KPINodeTypeNumericGTAtom,
			SdParameterID:            typedKPINode.SDParameterID,
			SdParameterSpecification: typedKPINode.SDParameterSpecification,
			NumericReferenceValue:    typedKPINode.ReferenceValue,
		}
	case *sharedModel.NumericGEQAtomKPINode:
		return graphQLModel.NumericGEQAtomKPINode{
			ID:                       id,
			ParentNodeID:             parentNodeID,
			NodeType:                 graphQLModel.KPINodeTypeNumericGEQAtom,
			SdParameterID:            typedKPINode.SDParameterID,
			SdParameterSpecification: typedKPINode.SDParameterSpecification,
			NumericReferenceValue:    typedKPINode.ReferenceValue,
		}
	case *sharedModel.LogicalOperationKPINode:
		return graphQLModel.LogicalOperationKPINode{
			ID:           id,
			ParentNodeID: parentNodeID,
			NodeType:     graphQLModel.KPINodeTypeLogicalOperation,
			Type: func(logicalOperationNodeType sharedModel.LogicalOperationNodeType) graphQLModel.LogicalOperationType {
				switch logicalOperationNodeType {
				case sharedModel.AND:
					return graphQLModel.LogicalOperationTypeAnd
				case sharedModel.OR:
					return graphQLModel.LogicalOperationTypeOr
				case sharedModel.NOR:
					return graphQLModel.LogicalOperationTypeNor
				}
				panic(fmt.Errorf("unpexted model mapping failure – shouldn't happen"))
			}(typedKPINode.Type),
		}
	}
	panic(fmt.Errorf("unpexted model mapping failure – shouldn't happen"))
}

func processKPINode(node sharedModel.KPINode, generateNextNumber func() uint32, parentID *uint32) []graphQLModel.KPINode {
	nodeID := generateNextNumber()
	nodes := make([]graphQLModel.KPINode, 0)
	nodes = append(nodes, toGraphQLModelKPINode(node, nodeID, parentID))
	if util.TypeIs[*sharedModel.LogicalOperationKPINode](node) {
		for _, childNode := range node.(*sharedModel.LogicalOperationKPINode).ChildNodes {
			nodes = append(nodes, processKPINode(childNode, generateNextNumber, &nodeID)...)
		}
	}
	return nodes
}

func ToGraphQLModelKPIDefinition(kpiDefinition sharedModel.KPIDefinition) graphQLModel.KPIDefinition {
	nodes := processKPINode(kpiDefinition.RootNode, util.SequentialNumberGenerator(), nil)
	return graphQLModel.KPIDefinition{
		ID:                  util.NewOptionalFromPointer(kpiDefinition.ID).GetPayload(),
		SdTypeID:            kpiDefinition.SDTypeID,
		SdTypeSpecification: kpiDefinition.SDTypeSpecification,
		UserIdentifier:      kpiDefinition.UserIdentifier,
		Nodes:               nodes,
	}
}
