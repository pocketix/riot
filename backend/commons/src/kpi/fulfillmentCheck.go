package kpi

import (
	"fmt"
	cUtil "github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func CheckKPIFulfillment(definition DefinitionDTO, inputDataMap *any) bool {
	return checkNodeFulfillment(definition.RootNode, inputDataMap)
}

func checkNodeFulfillment(node NodeDTO, inputDataMap *any) bool {
	return getCheckerForNode(node).checkNodeFulfillment(node, inputDataMap)
}

type nodeFulfillmentChecker interface {
	checkNodeFulfillment(node NodeDTO, inputDataMap *any) bool
}

func getCheckerForNode(node NodeDTO) nodeFulfillmentChecker {
	switch node.(type) {
	case EQAtomNodeDTO[string]:
		return &stringEQFulfillmentChecker{}
	case EQAtomNodeDTO[bool]:
		return &booleanEQFulfillmentChecker{}
	case EQAtomNodeDTO[float64]:
		return &numericEQFulfillmentChecker{}
	case NumericGTAtomNodeDTO:
		return &numericGTFulfillmentChecker{}
	case NumericGEQAtomNodeDTO:
		return &numericGEQFulfillmentChecker{}
	case NumericLTAtomNodeDTO:
		return &numericLTFulfillmentChecker{}
	case NumericLEQAtomNodeDTO:
		return &numericLEQFulfillmentChecker{}
	case LogicalOperationNodeDTO:
		return &logicalOperationFulfillmentChecker{}
	}
	panic("Unsupported type of node")
}

type stringEQFulfillmentChecker struct{}
type booleanEQFulfillmentChecker struct{}
type numericEQFulfillmentChecker struct{}
type numericGTFulfillmentChecker struct{}
type numericGEQFulfillmentChecker struct{}
type numericLTFulfillmentChecker struct{}
type numericLEQFulfillmentChecker struct{}
type logicalOperationFulfillmentChecker struct{}

func (_ *stringEQFulfillmentChecker) checkNodeFulfillment(node NodeDTO, inputDataMap *any) bool {
	stringEQAtomNode := node.(EQAtomNodeDTO[string])
	actualSDParameterValue := getTargetDataItemValue(inputDataMap, stringEQAtomNode.SDParameterSpecification).(string)
	return actualSDParameterValue == stringEQAtomNode.ReferenceValue
}

func (_ *booleanEQFulfillmentChecker) checkNodeFulfillment(node NodeDTO, inputDataMap *any) bool {
	booleanEQAtomNode := node.(EQAtomNodeDTO[bool])
	actualSDParameterValue := getTargetDataItemValue(inputDataMap, booleanEQAtomNode.SDParameterSpecification).(bool)
	return actualSDParameterValue == booleanEQAtomNode.ReferenceValue
}

func (_ *numericEQFulfillmentChecker) checkNodeFulfillment(node NodeDTO, inputDataMap *any) bool {
	numericEQAtomNode := node.(EQAtomNodeDTO[float64])
	actualSDParameterValue := getTargetDataItemValue(inputDataMap, numericEQAtomNode.SDParameterSpecification).(float64)
	return actualSDParameterValue == numericEQAtomNode.ReferenceValue
}

func (_ *numericGTFulfillmentChecker) checkNodeFulfillment(node NodeDTO, inputDataMap *any) bool {
	numericGTAtomNode := node.(NumericGTAtomNodeDTO)
	actualSDParameterValue := getTargetDataItemValue(inputDataMap, numericGTAtomNode.SDParameterSpecification).(float64)
	return actualSDParameterValue > numericGTAtomNode.ReferenceValue
}

func (_ *numericGEQFulfillmentChecker) checkNodeFulfillment(node NodeDTO, inputDataMap *any) bool {
	numericGEQAtomNode := node.(NumericGEQAtomNodeDTO)
	actualSDParameterValue := getTargetDataItemValue(inputDataMap, numericGEQAtomNode.SDParameterSpecification).(float64)
	return actualSDParameterValue >= numericGEQAtomNode.ReferenceValue
}

func (_ *numericLTFulfillmentChecker) checkNodeFulfillment(node NodeDTO, inputDataMap *any) bool {
	numericLTAtomNode := node.(NumericLTAtomNodeDTO)
	actualSDParameterValue := getTargetDataItemValue(inputDataMap, numericLTAtomNode.SDParameterSpecification).(float64)
	return actualSDParameterValue < numericLTAtomNode.ReferenceValue
}

func (_ *numericLEQFulfillmentChecker) checkNodeFulfillment(node NodeDTO, inputDataMap *any) bool {
	numericLEQAtomNode := node.(NumericLEQAtomNodeDTO)
	actualSDParameterValue := getTargetDataItemValue(inputDataMap, numericLEQAtomNode.SDParameterSpecification).(float64)
	return actualSDParameterValue <= numericLEQAtomNode.ReferenceValue
}

func getTargetDataItemValue(inputDataMap *any, targetDataItemKey string) any {
	return (*inputDataMap).(map[string]any)[targetDataItemKey]
}

func (_ *logicalOperationFulfillmentChecker) checkNodeFulfillment(node NodeDTO, inputDataMap *any) bool {
	logicalOperation := node.(LogicalOperationNodeDTO)
	switch logicalOperation.Type {
	case AND:
		return cUtil.All(logicalOperation.ChildNodes, func(node NodeDTO) bool {
			return checkNodeFulfillment(node, inputDataMap)
		})
	case OR:
		return cUtil.Any(logicalOperation.ChildNodes, func(node NodeDTO) bool {
			return checkNodeFulfillment(node, inputDataMap)
		})
	case NOR:
		return cUtil.All(logicalOperation.ChildNodes, func(node NodeDTO) bool {
			return !checkNodeFulfillment(node, inputDataMap)
		})
	default:
		panic(fmt.Sprintf("Unsupported LogicalOperationNodeType: %s", logicalOperation.Type))
	}
}
