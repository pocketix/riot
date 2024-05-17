package gql2dll

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func failureResultDueToMissingInputProperty() util.Result[sharedModel.KPINode] {
	return util.NewFailureResult[sharedModel.KPINode](fmt.Errorf("model mapping failure – a necessary input property is missing"))
}

func kpiNodeInputToKPINode(kpiNodeInput graphQLModel.KPINodeInput) util.Result[sharedModel.KPINode] {
	nodeType := kpiNodeInput.Type
	if nodeType == graphQLModel.KPINodeTypeLogicalOperation {
		logicalOperationTypeOptional := util.NewOptionalFromPointer[graphQLModel.LogicalOperationType](kpiNodeInput.LogicalOperationType)
		if logicalOperationTypeOptional.IsEmpty() {
			return failureResultDueToMissingInputProperty()
		}
		return util.NewSuccessResult[sharedModel.KPINode](&sharedModel.LogicalOperationKPINode{
			Type: func(logicalOperationNodeType graphQLModel.LogicalOperationType) sharedModel.LogicalOperationNodeType {
				switch logicalOperationNodeType {
				case graphQLModel.LogicalOperationTypeAnd:
					return sharedModel.AND
				case graphQLModel.LogicalOperationTypeOr:
					return sharedModel.OR
				case graphQLModel.LogicalOperationTypeNor:
					return sharedModel.NOR
				}
				panic(fmt.Errorf("unpexted model mapping failure – shouldn't happen"))
			}(logicalOperationTypeOptional.GetPayload()),
			ChildNodes: make([]sharedModel.KPINode, 0),
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
			return util.NewSuccessResult[sharedModel.KPINode](&sharedModel.StringEQAtomKPINode{
				SDParameterID:            sdParameterID,
				SDParameterSpecification: sdParameterSpecification,
				ReferenceValue:           referenceValueOptional.GetPayload(),
			})
		} else if nodeType == graphQLModel.KPINodeTypeBooleanEQAtom {
			referenceValueOptional := util.NewOptionalFromPointer[bool](kpiNodeInput.BooleanReferenceValue)
			if referenceValueOptional.IsEmpty() {
				return failureResultDueToMissingInputProperty()
			}
			return util.NewSuccessResult[sharedModel.KPINode](&sharedModel.BooleanEQAtomKPINode{
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
				return util.NewSuccessResult[sharedModel.KPINode](&sharedModel.NumericEQAtomKPINode{
					SDParameterID:            sdParameterID,
					SDParameterSpecification: sdParameterSpecification,
					ReferenceValue:           referenceValue,
				})
			case graphQLModel.KPINodeTypeNumericLTAtom:
				return util.NewSuccessResult[sharedModel.KPINode](&sharedModel.NumericLTAtomKPINode{
					SDParameterID:            sdParameterID,
					SDParameterSpecification: sdParameterSpecification,
					ReferenceValue:           referenceValue,
				})
			case graphQLModel.KPINodeTypeNumericLEQAtom:
				return util.NewSuccessResult[sharedModel.KPINode](&sharedModel.NumericLEQAtomKPINode{
					SDParameterID:            sdParameterID,
					SDParameterSpecification: sdParameterSpecification,
					ReferenceValue:           referenceValue,
				})
			case graphQLModel.KPINodeTypeNumericGTAtom:
				return util.NewSuccessResult[sharedModel.KPINode](&sharedModel.NumericGTAtomKPINode{
					SDParameterID:            sdParameterID,
					SDParameterSpecification: sdParameterSpecification,
					ReferenceValue:           referenceValue,
				})
			case graphQLModel.KPINodeTypeNumericGEQAtom:
				return util.NewSuccessResult[sharedModel.KPINode](&sharedModel.NumericGEQAtomKPINode{
					SDParameterID:            sdParameterID,
					SDParameterSpecification: sdParameterSpecification,
					ReferenceValue:           referenceValue,
				})
			}
		}
	}
	panic(fmt.Errorf("unpexted model mapping failure – shouldn't happen"))
}

func constructKPINodeByIDMap(kpiNodeInputs []graphQLModel.KPINodeInput) util.Result[map[uint32]sharedModel.KPINode] {
	kpiNodeByIDMap := make(map[uint32]sharedModel.KPINode)
	for _, kpiNodeInput := range kpiNodeInputs {
		kpiNodeResult := kpiNodeInputToKPINode(kpiNodeInput)
		if kpiNodeResult.IsFailure() {
			return util.NewFailureResult[map[uint32]sharedModel.KPINode](kpiNodeResult.GetError())
		}
		kpiNodeByIDMap[kpiNodeInput.ID] = kpiNodeResult.GetPayload()
	}
	return util.NewSuccessResult[map[uint32]sharedModel.KPINode](kpiNodeByIDMap)
}

func ToDLLModelKPIDefinition(kpiDefinitionInput graphQLModel.KPIDefinitionInput) util.Result[sharedModel.KPIDefinition] {
	kpiNodeInputs := kpiDefinitionInput.Nodes
	kpiNodeByIDMapConstructionResult := constructKPINodeByIDMap(kpiNodeInputs)
	if kpiNodeByIDMapConstructionResult.IsFailure() {
		return util.NewFailureResult[sharedModel.KPIDefinition](kpiNodeByIDMapConstructionResult.GetError())
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
		if !util.TypeIs[*sharedModel.LogicalOperationKPINode](parentNode) {
			return util.NewFailureResult[sharedModel.KPIDefinition](fmt.Errorf("model mapping failure – detected a parent node that's not a logical operation node"))
		}
		logicalOperationNode := parentNode.(*sharedModel.LogicalOperationKPINode)
		logicalOperationNode.ChildNodes = append(logicalOperationNode.ChildNodes, kpiNodeByIDMap[kpiNodeInput.ID])
		kpiNodeByIDMap[parentNodeID] = logicalOperationNode
	}
	if rootNodeIDOptional.IsEmpty() {
		return util.NewFailureResult[sharedModel.KPIDefinition](fmt.Errorf("model mapping failure – couldn't find root node ID"))
	}
	return util.NewSuccessResult[sharedModel.KPIDefinition](sharedModel.KPIDefinition{
		ID:                  nil,
		SDTypeID:            kpiDefinitionInput.SdTypeID,
		SDTypeSpecification: kpiDefinitionInput.SdTypeSpecification,
		UserIdentifier:      kpiDefinitionInput.UserIdentifier,
		RootNode:            kpiNodeByIDMap[rootNodeIDOptional.GetPayload()],
	})
}
