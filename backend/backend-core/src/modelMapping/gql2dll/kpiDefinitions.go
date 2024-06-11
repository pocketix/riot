package gql2dll

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"strings"
)

func failureResultDueToMissingInputProperty() sharedUtils.Result[sharedModel.KPINode] {
	return sharedUtils.NewFailureResult[sharedModel.KPINode](fmt.Errorf("model mapping failure – a necessary input property is missing"))
}

func kpiNodeInputToKPINode(kpiNodeInput graphQLModel.KPINodeInput) sharedUtils.Result[sharedModel.KPINode] {
	nodeType := kpiNodeInput.Type
	if nodeType == graphQLModel.KPINodeTypeLogicalOperation {
		logicalOperationTypeOptional := sharedUtils.NewOptionalFromPointer[graphQLModel.LogicalOperationType](kpiNodeInput.LogicalOperationType)
		if logicalOperationTypeOptional.IsEmpty() {
			return failureResultDueToMissingInputProperty()
		}
		return sharedUtils.NewSuccessResult[sharedModel.KPINode](&sharedModel.LogicalOperationKPINode{
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
		sdParameterIDOptional := sharedUtils.NewOptionalFromPointer[uint32](kpiNodeInput.SdParameterID)
		if sdParameterIDOptional.IsEmpty() {
			return failureResultDueToMissingInputProperty()
		}
		sdParameterID := sdParameterIDOptional.GetPayload()
		sdParameterSpecificationOptional := sharedUtils.NewOptionalFromPointer[string](kpiNodeInput.SdParameterSpecification)
		if sdParameterSpecificationOptional.IsEmpty() {
			return failureResultDueToMissingInputProperty()
		}
		sdParameterSpecification := sdParameterSpecificationOptional.GetPayload()
		if nodeType == graphQLModel.KPINodeTypeStringEQAtom {
			referenceValueOptional := sharedUtils.NewOptionalFromPointer[string](kpiNodeInput.StringReferenceValue)
			if referenceValueOptional.IsEmpty() {
				return failureResultDueToMissingInputProperty()
			}
			return sharedUtils.NewSuccessResult[sharedModel.KPINode](&sharedModel.StringEQAtomKPINode{
				SDParameterID:            sdParameterID,
				SDParameterSpecification: sdParameterSpecification,
				ReferenceValue:           referenceValueOptional.GetPayload(),
			})
		} else if nodeType == graphQLModel.KPINodeTypeBooleanEQAtom {
			referenceValueOptional := sharedUtils.NewOptionalFromPointer[bool](kpiNodeInput.BooleanReferenceValue)
			if referenceValueOptional.IsEmpty() {
				return failureResultDueToMissingInputProperty()
			}
			return sharedUtils.NewSuccessResult[sharedModel.KPINode](&sharedModel.BooleanEQAtomKPINode{
				SDParameterID:            sdParameterID,
				SDParameterSpecification: sharedUtils.NewOptionalFromPointer[string](kpiNodeInput.SdParameterSpecification).GetPayload(),
				ReferenceValue:           referenceValueOptional.GetPayload(),
			})
		} else {
			referenceValueOptional := sharedUtils.NewOptionalFromPointer[float64](kpiNodeInput.NumericReferenceValue)
			if referenceValueOptional.IsEmpty() {
				return failureResultDueToMissingInputProperty()
			}
			referenceValue := referenceValueOptional.GetPayload()
			switch nodeType {
			case graphQLModel.KPINodeTypeNumericEQAtom:
				return sharedUtils.NewSuccessResult[sharedModel.KPINode](&sharedModel.NumericEQAtomKPINode{
					SDParameterID:            sdParameterID,
					SDParameterSpecification: sdParameterSpecification,
					ReferenceValue:           referenceValue,
				})
			case graphQLModel.KPINodeTypeNumericLTAtom:
				return sharedUtils.NewSuccessResult[sharedModel.KPINode](&sharedModel.NumericLTAtomKPINode{
					SDParameterID:            sdParameterID,
					SDParameterSpecification: sdParameterSpecification,
					ReferenceValue:           referenceValue,
				})
			case graphQLModel.KPINodeTypeNumericLEQAtom:
				return sharedUtils.NewSuccessResult[sharedModel.KPINode](&sharedModel.NumericLEQAtomKPINode{
					SDParameterID:            sdParameterID,
					SDParameterSpecification: sdParameterSpecification,
					ReferenceValue:           referenceValue,
				})
			case graphQLModel.KPINodeTypeNumericGTAtom:
				return sharedUtils.NewSuccessResult[sharedModel.KPINode](&sharedModel.NumericGTAtomKPINode{
					SDParameterID:            sdParameterID,
					SDParameterSpecification: sdParameterSpecification,
					ReferenceValue:           referenceValue,
				})
			case graphQLModel.KPINodeTypeNumericGEQAtom:
				return sharedUtils.NewSuccessResult[sharedModel.KPINode](&sharedModel.NumericGEQAtomKPINode{
					SDParameterID:            sdParameterID,
					SDParameterSpecification: sdParameterSpecification,
					ReferenceValue:           referenceValue,
				})
			}
		}
	}
	panic(fmt.Errorf("unpexted model mapping failure – shouldn't happen"))
}

func constructKPINodeByIDMap(kpiNodeInputs []graphQLModel.KPINodeInput) sharedUtils.Result[map[uint32]sharedModel.KPINode] {
	kpiNodeByIDMap := make(map[uint32]sharedModel.KPINode)
	for _, kpiNodeInput := range kpiNodeInputs {
		kpiNodeResult := kpiNodeInputToKPINode(kpiNodeInput)
		if kpiNodeResult.IsFailure() {
			return sharedUtils.NewFailureResult[map[uint32]sharedModel.KPINode](kpiNodeResult.GetError())
		}
		kpiNodeByIDMap[kpiNodeInput.ID] = kpiNodeResult.GetPayload()
	}
	return sharedUtils.NewSuccessResult[map[uint32]sharedModel.KPINode](kpiNodeByIDMap)
}

func ToDLLModelKPIDefinition(kpiDefinitionInput graphQLModel.KPIDefinitionInput) sharedUtils.Result[sharedModel.KPIDefinition] {
	kpiNodeInputs := kpiDefinitionInput.Nodes
	kpiNodeByIDMapConstructionResult := constructKPINodeByIDMap(kpiNodeInputs)
	if kpiNodeByIDMapConstructionResult.IsFailure() {
		return sharedUtils.NewFailureResult[sharedModel.KPIDefinition](kpiNodeByIDMapConstructionResult.GetError())
	}
	kpiNodeByIDMap := kpiNodeByIDMapConstructionResult.GetPayload()
	rootNodeIDOptional := sharedUtils.NewEmptyOptional[uint32]()
	for _, kpiNodeInput := range kpiNodeInputs {
		parentNodeIDOptional := sharedUtils.NewOptionalFromPointer(kpiNodeInput.ParentNodeID)
		if parentNodeIDOptional.IsEmpty() {
			rootNodeIDOptional = sharedUtils.NewOptionalOf(kpiNodeInput.ID)
			continue
		}
		parentNodeID := parentNodeIDOptional.GetPayload()
		parentNode := kpiNodeByIDMap[parentNodeID]
		if !sharedUtils.TypeIs[*sharedModel.LogicalOperationKPINode](parentNode) {
			return sharedUtils.NewFailureResult[sharedModel.KPIDefinition](fmt.Errorf("model mapping failure – detected a parent node that's not a logical operation node"))
		}
		logicalOperationNode := parentNode.(*sharedModel.LogicalOperationKPINode)
		logicalOperationNode.ChildNodes = append(logicalOperationNode.ChildNodes, kpiNodeByIDMap[kpiNodeInput.ID])
		kpiNodeByIDMap[parentNodeID] = logicalOperationNode
	}
	if rootNodeIDOptional.IsEmpty() {
		return sharedUtils.NewFailureResult[sharedModel.KPIDefinition](fmt.Errorf("model mapping failure – couldn't find root node ID"))
	}
	return sharedUtils.NewSuccessResult[sharedModel.KPIDefinition](sharedModel.KPIDefinition{
		ID:                     nil,
		SDTypeID:               kpiDefinitionInput.SdTypeID,
		SDTypeSpecification:    kpiDefinitionInput.SdTypeSpecification,
		UserIdentifier:         kpiDefinitionInput.UserIdentifier,
		RootNode:               kpiNodeByIDMap[rootNodeIDOptional.GetPayload()],
		SDInstanceMode:         sharedModel.SDInstanceMode(strings.ToLower(string(kpiDefinitionInput.SdInstanceMode))),
		SelectedSDInstanceUIDs: kpiDefinitionInput.SelectedSDInstanceUIDs,
	})
}
