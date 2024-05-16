package dll2gql

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/kpi"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func kpiNodeDTOToKPINode(kpiNodeDTO kpi.NodeDTO, id uint32, parentNodeID *uint32) graphQLModel.KPINode {
	switch kpiNodeDTO.(type) {
	case kpi.EQAtomNodeDTO[string]:
		stringEQAtomNodeDTO := kpiNodeDTO.(kpi.EQAtomNodeDTO[string])
		return graphQLModel.StringEQAtomKPINode{
			ID:                       id,
			ParentNodeID:             parentNodeID,
			NodeType:                 graphQLModel.KPINodeTypeStringEQAtom,
			SdParameterID:            stringEQAtomNodeDTO.SDParameterID,
			SdParameterSpecification: stringEQAtomNodeDTO.SDParameterSpecification,
			StringReferenceValue:     stringEQAtomNodeDTO.ReferenceValue,
		}
	case kpi.EQAtomNodeDTO[bool]:
		booleanEQAtomNodeDTO := kpiNodeDTO.(kpi.EQAtomNodeDTO[bool])
		return graphQLModel.BooleanEQAtomKPINode{
			ID:                       id,
			ParentNodeID:             parentNodeID,
			NodeType:                 graphQLModel.KPINodeTypeBooleanEQAtom,
			SdParameterID:            booleanEQAtomNodeDTO.SDParameterID,
			SdParameterSpecification: booleanEQAtomNodeDTO.SDParameterSpecification,
			BooleanReferenceValue:    booleanEQAtomNodeDTO.ReferenceValue,
		}
	case kpi.EQAtomNodeDTO[float64]:
		numericEQAtomNodeDTO := kpiNodeDTO.(kpi.EQAtomNodeDTO[float64])
		return graphQLModel.NumericEQAtomKPINode{
			ID:                       id,
			ParentNodeID:             parentNodeID,
			NodeType:                 graphQLModel.KPINodeTypeNumericEQAtom,
			SdParameterID:            numericEQAtomNodeDTO.SDParameterID,
			SdParameterSpecification: numericEQAtomNodeDTO.SDParameterSpecification,
			NumericReferenceValue:    numericEQAtomNodeDTO.ReferenceValue,
		}
	case kpi.NumericLTAtomNodeDTO:
		numericLTAtomNodeDTO := kpiNodeDTO.(kpi.NumericLTAtomNodeDTO)
		return graphQLModel.NumericLTAtomKPINode{
			ID:                       id,
			ParentNodeID:             parentNodeID,
			NodeType:                 graphQLModel.KPINodeTypeNumericLTAtom,
			SdParameterID:            numericLTAtomNodeDTO.SDParameterID,
			SdParameterSpecification: numericLTAtomNodeDTO.SDParameterSpecification,
			NumericReferenceValue:    numericLTAtomNodeDTO.ReferenceValue,
		}
	case kpi.NumericLEQAtomNodeDTO:
		numericLEQAtomNodeDTO := kpiNodeDTO.(kpi.NumericLEQAtomNodeDTO)
		return graphQLModel.NumericLEQAtomKPINode{
			ID:                       id,
			ParentNodeID:             parentNodeID,
			NodeType:                 graphQLModel.KPINodeTypeNumericLEQAtom,
			SdParameterID:            numericLEQAtomNodeDTO.SDParameterID,
			SdParameterSpecification: numericLEQAtomNodeDTO.SDParameterSpecification,
			NumericReferenceValue:    numericLEQAtomNodeDTO.ReferenceValue,
		}
	case kpi.NumericGTAtomNodeDTO:
		numericGTAtomNodeDTO := kpiNodeDTO.(kpi.NumericGTAtomNodeDTO)
		return graphQLModel.NumericGTAtomKPINode{
			ID:                       id,
			ParentNodeID:             parentNodeID,
			NodeType:                 graphQLModel.KPINodeTypeNumericGTAtom,
			SdParameterID:            numericGTAtomNodeDTO.SDParameterID,
			SdParameterSpecification: numericGTAtomNodeDTO.SDParameterSpecification,
			NumericReferenceValue:    numericGTAtomNodeDTO.ReferenceValue,
		}
	case kpi.NumericGEQAtomNodeDTO:
		numericGEQAtomNodeDTO := kpiNodeDTO.(kpi.NumericGEQAtomNodeDTO)
		return graphQLModel.NumericGEQAtomKPINode{
			ID:                       id,
			ParentNodeID:             parentNodeID,
			NodeType:                 graphQLModel.KPINodeTypeNumericGEQAtom,
			SdParameterID:            numericGEQAtomNodeDTO.SDParameterID,
			SdParameterSpecification: numericGEQAtomNodeDTO.SDParameterSpecification,
			NumericReferenceValue:    numericGEQAtomNodeDTO.ReferenceValue,
		}
	case kpi.LogicalOperationNodeDTO:
		logicalOperationNodeDTO := kpiNodeDTO.(kpi.LogicalOperationNodeDTO)
		return graphQLModel.LogicalOperationKPINode{
			ID:           id,
			ParentNodeID: parentNodeID,
			NodeType:     graphQLModel.KPINodeTypeLogicalOperation,
			Type: func(logicalOperationNodeType kpi.LogicalOperationNodeType) graphQLModel.LogicalOperationType {
				switch logicalOperationNodeType {
				case kpi.AND:
					return graphQLModel.LogicalOperationTypeAnd
				case kpi.OR:
					return graphQLModel.LogicalOperationTypeOr
				case kpi.NOR:
					return graphQLModel.LogicalOperationTypeNor
				}
				panic(fmt.Errorf("unpexted model mapping failure – shouldn't happen"))
			}(logicalOperationNodeDTO.Type),
		}
	}
	panic(fmt.Errorf("unpexted model mapping failure – shouldn't happen"))
}

func processKPINodeDTO(node kpi.NodeDTO, generateNextNumber func() uint32, parentID *uint32) []graphQLModel.KPINode {
	nodeID := generateNextNumber()
	nodes := make([]graphQLModel.KPINode, 0)
	nodes = append(nodes, kpiNodeDTOToKPINode(node, nodeID, parentID))
	if util.TypeIs[kpi.LogicalOperationNodeDTO](node) {
		for _, childNode := range node.(kpi.LogicalOperationNodeDTO).ChildNodes {
			nodes = append(nodes, processKPINodeDTO(childNode, generateNextNumber, &nodeID)...)
		}
	}
	return nodes
}

func KPIDefinitionDTOToKPIDefinition(kpiDefinitionDTO kpi.DefinitionDTO) graphQLModel.KPIDefinition {
	nodes := processKPINodeDTO(kpiDefinitionDTO.RootNode, util.SequentialNumberGenerator(), nil)
	return graphQLModel.KPIDefinition{
		ID:                  kpiDefinitionDTO.ID.GetPayload(),
		SdTypeID:            kpiDefinitionDTO.SDTypeID,
		SdTypeSpecification: kpiDefinitionDTO.SDTypeSpecification,
		UserIdentifier:      kpiDefinitionDTO.UserIdentifier,
		Nodes:               nodes,
	}
}
