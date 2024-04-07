package dto2api

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/api/graphql/model"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/kpi"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
	"github.com/google/uuid"
)

func kpiNodeDTOToKPINode(kpiNodeDTO kpi.NodeDTO, id string, parentNodeID *string) model.KPINode {
	switch kpiNodeDTO.(type) {
	case kpi.EQAtomNodeDTO[string]:
		stringEQAtomNodeDTO := kpiNodeDTO.(kpi.EQAtomNodeDTO[string])
		return model.StringEQAtomKPINode{
			ID:                       id,
			ParentNodeID:             parentNodeID,
			SdParameterSpecification: stringEQAtomNodeDTO.SDParameterSpecification,
			StringReferenceValue:     stringEQAtomNodeDTO.ReferenceValue,
		}
	case kpi.EQAtomNodeDTO[bool]:
		booleanEQAtomNodeDTO := kpiNodeDTO.(kpi.EQAtomNodeDTO[bool])
		return model.BooleanEQAtomKPINode{
			ID:                       id,
			ParentNodeID:             parentNodeID,
			SdParameterSpecification: booleanEQAtomNodeDTO.SDParameterSpecification,
			BooleanReferenceValue:    booleanEQAtomNodeDTO.ReferenceValue,
		}
	case kpi.EQAtomNodeDTO[float64]:
		numericEQAtomNodeDTO := kpiNodeDTO.(kpi.EQAtomNodeDTO[float64])
		return model.NumericEQAtomKPINode{
			ID:                       id,
			ParentNodeID:             parentNodeID,
			SdParameterSpecification: numericEQAtomNodeDTO.SDParameterSpecification,
			NumericReferenceValue:    numericEQAtomNodeDTO.ReferenceValue,
		}
	case kpi.NumericLTAtomNodeDTO:
		numericLTAtomNodeDTO := kpiNodeDTO.(kpi.NumericLTAtomNodeDTO)
		return model.NumericLTAtomKPINode{
			ID:                       id,
			ParentNodeID:             parentNodeID,
			SdParameterSpecification: numericLTAtomNodeDTO.SDParameterSpecification,
			NumericReferenceValue:    numericLTAtomNodeDTO.ReferenceValue,
		}
	case kpi.NumericLEQAtomNodeDTO:
		numericLEQAtomNodeDTO := kpiNodeDTO.(kpi.NumericLEQAtomNodeDTO)
		return model.NumericLEQAtomKPINode{
			ID:                       id,
			ParentNodeID:             parentNodeID,
			SdParameterSpecification: numericLEQAtomNodeDTO.SDParameterSpecification,
			NumericReferenceValue:    numericLEQAtomNodeDTO.ReferenceValue,
		}
	case kpi.NumericGTAtomNodeDTO:
		numericGTAtomNodeDTO := kpiNodeDTO.(kpi.NumericGTAtomNodeDTO)
		return model.NumericGTAtomKPINode{
			ID:                       id,
			ParentNodeID:             parentNodeID,
			SdParameterSpecification: numericGTAtomNodeDTO.SDParameterSpecification,
			NumericReferenceValue:    numericGTAtomNodeDTO.ReferenceValue,
		}
	case kpi.NumericGEQAtomNodeDTO:
		numericGEQAtomNodeDTO := kpiNodeDTO.(kpi.NumericGEQAtomNodeDTO)
		return model.NumericGEQAtomKPINode{
			ID:                       id,
			ParentNodeID:             parentNodeID,
			SdParameterSpecification: numericGEQAtomNodeDTO.SDParameterSpecification,
			NumericReferenceValue:    numericGEQAtomNodeDTO.ReferenceValue,
		}
	case kpi.LogicalOperationNodeDTO:
		logicalOperationNodeDTO := kpiNodeDTO.(kpi.LogicalOperationNodeDTO)
		return model.LogicalOperationKPINode{
			ID:           id,
			ParentNodeID: parentNodeID,
			Type: func(logicalOperationNodeType kpi.LogicalOperationNodeType) model.LogicalOperationType {
				switch logicalOperationNodeType {
				case kpi.AND:
					return model.LogicalOperationTypeAnd
				case kpi.OR:
					return model.LogicalOperationTypeOr
				case kpi.NOR:
					return model.LogicalOperationTypeNor
				}
				panic("couldn't map kpi.LogicalOperationNodeType to model.LogicalOperationType... shouldn't happen")
			}(logicalOperationNodeDTO.Type),
		}
	}
	panic("couldn't map kpi.NodeDTO to model.KPINode... shouldn't happen")
}

func processKPINodeDTO(node kpi.NodeDTO, parentID *string) []model.KPINode {
	nodeID := uuid.New().String()
	nodes := make([]model.KPINode, 0)
	nodes = append(nodes, kpiNodeDTOToKPINode(node, nodeID, parentID))
	if util.TypeIs[kpi.LogicalOperationNodeDTO](node) {
		for _, childNode := range node.(kpi.LogicalOperationNodeDTO).ChildNodes {
			nodes = append(nodes, processKPINodeDTO(childNode, &nodeID)...)
		}
	}
	return nodes
}

func KPIDefinitionDTOToKPIDefinition(kpiDefinitionDTO kpi.DefinitionDTO) *model.KPIDefinition {
	nodes := processKPINodeDTO(kpiDefinitionDTO.RootNode, nil)
	return &model.KPIDefinition{
		ID:                  util.UINT32ToString(kpiDefinitionDTO.ID.GetPayload()),
		SdTypeSpecification: kpiDefinitionDTO.SDTypeSpecification,
		UserIdentifier:      kpiDefinitionDTO.UserIdentifier,
		Nodes:               nodes,
	}
}
