package kpi

import (
	"fmt"
	cUtil "github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func CheckKPIFulfillment(definition DefinitionDTO, inputDataMap *interface{}) bool {
	return checkNodeFulfillment(definition.RootNode, inputDataMap)
}

func checkNodeFulfillment(node NodeDTO, inputDataMap *interface{}) bool {
	return getCheckerForNode(node).checkNodeFulfillment(node, inputDataMap)
}

type nodeFulfillmentChecker interface {
	checkNodeFulfillment(node NodeDTO, inputDataMap *interface{}) bool
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

func (_ *stringEQFulfillmentChecker) checkNodeFulfillment(node NodeDTO, inputDataMap *interface{}) bool {
	eqAtomNode := node.(*EQAtomNodeDTO[string])
	referenceValue := getTargetDataItemValue(inputDataMap, eqAtomNode.SDParameterSpecification).(string)
	return eqAtomNode.ReferenceValue == referenceValue
}

func (_ *booleanEQFulfillmentChecker) checkNodeFulfillment(node NodeDTO, inputDataMap *interface{}) bool {
	eqAtomNode := node.(*EQAtomNodeDTO[bool])
	referenceValue := getTargetDataItemValue(inputDataMap, eqAtomNode.SDParameterSpecification).(bool)
	return eqAtomNode.ReferenceValue == referenceValue
}

func (_ *numericEQFulfillmentChecker) checkNodeFulfillment(node NodeDTO, inputDataMap *interface{}) bool {
	eqAtomNode := node.(*EQAtomNodeDTO[float64])
	referenceValue := getTargetDataItemValue(inputDataMap, eqAtomNode.SDParameterSpecification).(float64)
	return eqAtomNode.ReferenceValue == referenceValue
}

func (_ *numericGTFulfillmentChecker) checkNodeFulfillment(node NodeDTO, inputDataMap *interface{}) bool {
	eqAtomNode := node.(*NumericGTAtomNodeDTO)
	referenceValue := getTargetDataItemValue(inputDataMap, eqAtomNode.SDParameterSpecification).(float64)
	return eqAtomNode.ReferenceValue > referenceValue
}

func (_ *numericGEQFulfillmentChecker) checkNodeFulfillment(node NodeDTO, inputDataMap *interface{}) bool {
	eqAtomNode := node.(*NumericGEQAtomNodeDTO)
	referenceValue := getTargetDataItemValue(inputDataMap, eqAtomNode.SDParameterSpecification).(float64)
	return eqAtomNode.ReferenceValue >= referenceValue
}

func (_ *numericLTFulfillmentChecker) checkNodeFulfillment(node NodeDTO, inputDataMap *interface{}) bool {
	eqAtomNode := node.(*NumericGTAtomNodeDTO)
	referenceValue := getTargetDataItemValue(inputDataMap, eqAtomNode.SDParameterSpecification).(float64)
	return eqAtomNode.ReferenceValue < referenceValue
}

func (_ *numericLEQFulfillmentChecker) checkNodeFulfillment(node NodeDTO, inputDataMap *interface{}) bool {
	eqAtomNode := node.(*NumericGEQAtomNodeDTO)
	referenceValue := getTargetDataItemValue(inputDataMap, eqAtomNode.SDParameterSpecification).(float64)
	return eqAtomNode.ReferenceValue <= referenceValue
}

func getTargetDataItemValue(inputDataMap *interface{}, targetDataItemKey string) interface{} {
	return (*inputDataMap).(map[string]interface{})[targetDataItemKey]
}

func (_ *logicalOperationFulfillmentChecker) checkNodeFulfillment(node NodeDTO, inputDataMap *interface{}) bool {
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
