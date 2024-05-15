package api2dto

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/kpi"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func failureResultDueToMissingInputProperty() util.Result[kpi.NodeDTO] {
	return util.NewFailureResult[kpi.NodeDTO](fmt.Errorf("model mapping failure – a necessary input property is missing"))
}

func kpiNodeInputToKPINode(kpiNodeInput graphQLModel.KPINodeInput) util.Result[kpi.NodeDTO] {
	nodeType := kpiNodeInput.Type
	if nodeType == graphQLModel.KPINodeTypeLogicalOperation {
		logicalOperationTypeOptional := util.NewOptionalFromPointer[graphQLModel.LogicalOperationType](kpiNodeInput.LogicalOperationType)
		if logicalOperationTypeOptional.IsEmpty() {
			return failureResultDueToMissingInputProperty()
		}
		return util.NewSuccessResult[kpi.NodeDTO](kpi.LogicalOperationNodeDTO{
			Type: func(logicalOperationNodeType graphQLModel.LogicalOperationType) kpi.LogicalOperationNodeType {
				switch logicalOperationNodeType {
				case graphQLModel.LogicalOperationTypeAnd:
					return kpi.AND
				case graphQLModel.LogicalOperationTypeOr:
					return kpi.OR
				case graphQLModel.LogicalOperationTypeNor:
					return kpi.NOR
				}
				panic(fmt.Errorf("unpexted model mapping failure – shouldn't happen"))
			}(logicalOperationTypeOptional.GetPayload()),
			ChildNodes: make([]kpi.NodeDTO, 0),
		})
	} else {
		sdParameterIDOptional := util.NewOptionalFromPointer[uint32](kpiNodeInput.SdParameterID)
		if sdParameterIDOptional.IsEmpty() {
			return failureResultDueToMissingInputProperty()
		}
		sdParameterID := sdParameterIDOptional.GetPayload()
		sdParameterSpecificationOptional := util.NewOptionalFromPointer[string](kpiNodeInput.SdParameterSpecification)
		if sdParameterSpecificationOptional.IsEmpty() {
			return failureResultDueToMissingInputProperty()
		}
		sdParameterSpecification := sdParameterSpecificationOptional.GetPayload()
		if nodeType == graphQLModel.KPINodeTypeStringEQAtom {
			referenceValueOptional := util.NewOptionalFromPointer[string](kpiNodeInput.StringReferenceValue)
			if referenceValueOptional.IsEmpty() {
				return failureResultDueToMissingInputProperty()
			}
			return util.NewSuccessResult[kpi.NodeDTO](kpi.EQAtomNodeDTO[string]{
				SDParameterID:            sdParameterID,
				SDParameterSpecification: sdParameterSpecification,
				ReferenceValue:           referenceValueOptional.GetPayload(),
			})
		} else if nodeType == graphQLModel.KPINodeTypeBooleanEQAtom {
			referenceValueOptional := util.NewOptionalFromPointer[bool](kpiNodeInput.BooleanReferenceValue)
			if referenceValueOptional.IsEmpty() {
				return failureResultDueToMissingInputProperty()
			}
			return util.NewSuccessResult[kpi.NodeDTO](kpi.EQAtomNodeDTO[bool]{
				SDParameterID:            sdParameterID,
				SDParameterSpecification: util.NewOptionalFromPointer[string](kpiNodeInput.SdParameterSpecification).GetPayload(),
				ReferenceValue:           referenceValueOptional.GetPayload(),
			})
		} else {
			referenceValueOptional := util.NewOptionalFromPointer[float64](kpiNodeInput.NumericReferenceValue)
			if referenceValueOptional.IsEmpty() {
				return failureResultDueToMissingInputProperty()
			}
			referenceValue := referenceValueOptional.GetPayload()
			switch nodeType {
			case graphQLModel.KPINodeTypeNumericEQAtom:
				return util.NewSuccessResult[kpi.NodeDTO](kpi.EQAtomNodeDTO[float64]{
					SDParameterID:            sdParameterID,
					SDParameterSpecification: sdParameterSpecification,
					ReferenceValue:           referenceValue,
				})
			case graphQLModel.KPINodeTypeNumericLTAtom:
				return util.NewSuccessResult[kpi.NodeDTO](kpi.NumericLTAtomNodeDTO{
					SDParameterID:            sdParameterID,
					SDParameterSpecification: sdParameterSpecification,
					ReferenceValue:           referenceValue,
				})
			case graphQLModel.KPINodeTypeNumericLEQAtom:
				return util.NewSuccessResult[kpi.NodeDTO](kpi.NumericLEQAtomNodeDTO{
					SDParameterID:            sdParameterID,
					SDParameterSpecification: sdParameterSpecification,
					ReferenceValue:           referenceValue,
				})
			case graphQLModel.KPINodeTypeNumericGTAtom:
				return util.NewSuccessResult[kpi.NodeDTO](kpi.NumericGTAtomNodeDTO{
					SDParameterID:            sdParameterID,
					SDParameterSpecification: sdParameterSpecification,
					ReferenceValue:           referenceValue,
				})
			case graphQLModel.KPINodeTypeNumericGEQAtom:
				return util.NewSuccessResult[kpi.NodeDTO](kpi.NumericGEQAtomNodeDTO{
					SDParameterID:            sdParameterID,
					SDParameterSpecification: sdParameterSpecification,
					ReferenceValue:           referenceValue,
				})
			}
		}
	}
	panic(fmt.Errorf("unpexted model mapping failure – shouldn't happen"))
}

func constructKPINodeByIDMap(kpiNodeInputs []graphQLModel.KPINodeInput) util.Result[map[uint32]kpi.NodeDTO] {
	kpiNodeByIDMap := make(map[uint32]kpi.NodeDTO)
	for _, kpiNodeInput := range kpiNodeInputs {
		kpiNodeResult := kpiNodeInputToKPINode(kpiNodeInput)
		if kpiNodeResult.IsFailure() {
			return util.NewFailureResult[map[uint32]kpi.NodeDTO](kpiNodeResult.GetError())
		}
		kpiNodeByIDMap[kpiNodeInput.ID] = kpiNodeResult.GetPayload()
	}
	return util.NewSuccessResult[map[uint32]kpi.NodeDTO](kpiNodeByIDMap)
}

func KPIDefinitionInputToKPIDefinitionDTO(kpiDefinitionInput graphQLModel.KPIDefinitionInput) util.Result[kpi.DefinitionDTO] {
	kpiNodeInputs := kpiDefinitionInput.Nodes
	kpiNodeByIDMapConstructionResult := constructKPINodeByIDMap(kpiNodeInputs)
	if kpiNodeByIDMapConstructionResult.IsFailure() {
		return util.NewFailureResult[kpi.DefinitionDTO](kpiNodeByIDMapConstructionResult.GetError())
	}
	kpiNodeByIDMap := kpiNodeByIDMapConstructionResult.GetPayload()
	rootNodeIDOptional := util.NewEmptyOptional[uint32]()
	for _, kpiNodeInput := range kpiNodeInputs {
		parentNodeIDOptional := util.NewOptionalFromPointer(kpiNodeInput.ParentNodeID)
		if parentNodeIDOptional.IsEmpty() {
			rootNodeIDOptional = util.NewOptionalOf(kpiNodeInput.ID)
			continue
		}
		parentNodeID := parentNodeIDOptional.GetPayload()
		parentNode := kpiNodeByIDMap[parentNodeID]
		if !util.TypeIs[kpi.LogicalOperationNodeDTO](parentNode) {
			return util.NewFailureResult[kpi.DefinitionDTO](fmt.Errorf("model mapping failure – detected a parent node that's not a logical operation node"))
		}
		logicalOperationNode := parentNode.(kpi.LogicalOperationNodeDTO)
		logicalOperationNode.ChildNodes = append(logicalOperationNode.ChildNodes, kpiNodeByIDMap[kpiNodeInput.ID])
		kpiNodeByIDMap[parentNodeID] = logicalOperationNode
	}
	if rootNodeIDOptional.IsEmpty() {
		return util.NewFailureResult[kpi.DefinitionDTO](fmt.Errorf("model mapping failure – couldn't find root node ID"))
	}
	return util.NewSuccessResult[kpi.DefinitionDTO](kpi.DefinitionDTO{
		ID:                  util.NewEmptyOptional[uint32](),
		SDTypeID:            kpiDefinitionInput.SdTypeID,
		SDTypeSpecification: kpiDefinitionInput.SdTypeSpecification,
		UserIdentifier:      kpiDefinitionInput.UserIdentifier,
		RootNode:            kpiNodeByIDMap[rootNodeIDOptional.GetPayload()],
	})
}
