package processing

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedModel"
	cUtil "github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func CheckKPIFulfillment(kpiDefinition sharedModel.KPIDefinition, sdParameterValueMap *any) bool {
	return checkKPINodeFulfillment(kpiDefinition.RootNode, sdParameterValueMap)
}

func checkKPINodeFulfillment(kpiNode sharedModel.KPINode, sdParameterValueMap *any) bool {
	return getCheckerForKPINode(kpiNode).checkNodeFulfillment(kpiNode, sdParameterValueMap)
}

type kpiNodeFulfillmentChecker interface {
	checkNodeFulfillment(kpiNode sharedModel.KPINode, sdParameterValueMap *any) bool
}

func getCheckerForKPINode(kpiNode sharedModel.KPINode) kpiNodeFulfillmentChecker {
	switch kpiNode.(type) {
	case *sharedModel.StringEQAtomKPINode:
		return &stringEQKPINodeFulfillmentChecker{}
	case *sharedModel.BooleanEQAtomKPINode:
		return &booleanEQKPINodeFulfillmentChecker{}
	case *sharedModel.NumericEQAtomKPINode:
		return &numericEQKPINodeFulfillmentChecker{}
	case *sharedModel.NumericGTAtomKPINode:
		return &numericGTKPINodeFulfillmentChecker{}
	case *sharedModel.NumericGEQAtomKPINode:
		return &numericGEQKPINodeFulfillmentChecker{}
	case *sharedModel.NumericLTAtomKPINode:
		return &numericLTKPINodeFulfillmentChecker{}
	case *sharedModel.NumericLEQAtomKPINode:
		return &numericLEQKPINodeFulfillmentChecker{}
	case *sharedModel.LogicalOperationKPINode:
		return &logicalOperationKPINodeFulfillmentChecker{}
	}
	panic(fmt.Errorf("unsupported type of KPI node: %T", kpiNode))
}

type stringEQKPINodeFulfillmentChecker struct{}
type booleanEQKPINodeFulfillmentChecker struct{}
type numericEQKPINodeFulfillmentChecker struct{}
type numericGTKPINodeFulfillmentChecker struct{}
type numericGEQKPINodeFulfillmentChecker struct{}
type numericLTKPINodeFulfillmentChecker struct{}
type numericLEQKPINodeFulfillmentChecker struct{}
type logicalOperationKPINodeFulfillmentChecker struct{}

func (_ *stringEQKPINodeFulfillmentChecker) checkNodeFulfillment(kpiNode sharedModel.KPINode, sdParameterValueMap *any) bool {
	stringEQAtomKPINode := kpiNode.(*sharedModel.StringEQAtomKPINode)
	actualSDParameterValue := getTargetDataItemValue(sdParameterValueMap, stringEQAtomKPINode.SDParameterSpecification).(string)
	return actualSDParameterValue == stringEQAtomKPINode.ReferenceValue
}

func (_ *booleanEQKPINodeFulfillmentChecker) checkNodeFulfillment(kpiNode sharedModel.KPINode, sdParameterValueMap *any) bool {
	booleanEQAtomKPINode := kpiNode.(*sharedModel.BooleanEQAtomKPINode)
	actualSDParameterValue := getTargetDataItemValue(sdParameterValueMap, booleanEQAtomKPINode.SDParameterSpecification).(bool)
	return actualSDParameterValue == booleanEQAtomKPINode.ReferenceValue
}

func (_ *numericEQKPINodeFulfillmentChecker) checkNodeFulfillment(kpiNode sharedModel.KPINode, sdParameterValueMap *any) bool {
	numericEQAtomKPINode := kpiNode.(*sharedModel.NumericEQAtomKPINode)
	actualSDParameterValue := getTargetDataItemValue(sdParameterValueMap, numericEQAtomKPINode.SDParameterSpecification).(float64)
	return actualSDParameterValue == numericEQAtomKPINode.ReferenceValue
}

func (_ *numericGTKPINodeFulfillmentChecker) checkNodeFulfillment(kpiNode sharedModel.KPINode, sdParameterValueMap *any) bool {
	numericGTAtomKPINode := kpiNode.(*sharedModel.NumericGTAtomKPINode)
	actualSDParameterValue := getTargetDataItemValue(sdParameterValueMap, numericGTAtomKPINode.SDParameterSpecification).(float64)
	return actualSDParameterValue > numericGTAtomKPINode.ReferenceValue
}

func (_ *numericGEQKPINodeFulfillmentChecker) checkNodeFulfillment(kpiNode sharedModel.KPINode, sdParameterValueMap *any) bool {
	numericGEQAtomKPINode := kpiNode.(*sharedModel.NumericGEQAtomKPINode)
	actualSDParameterValue := getTargetDataItemValue(sdParameterValueMap, numericGEQAtomKPINode.SDParameterSpecification).(float64)
	return actualSDParameterValue >= numericGEQAtomKPINode.ReferenceValue
}

func (_ *numericLTKPINodeFulfillmentChecker) checkNodeFulfillment(kpiNode sharedModel.KPINode, sdParameterValueMap *any) bool {
	numericLTAtomKPINode := kpiNode.(*sharedModel.NumericLTAtomKPINode)
	actualSDParameterValue := getTargetDataItemValue(sdParameterValueMap, numericLTAtomKPINode.SDParameterSpecification).(float64)
	return actualSDParameterValue < numericLTAtomKPINode.ReferenceValue
}

func (_ *numericLEQKPINodeFulfillmentChecker) checkNodeFulfillment(kpiNode sharedModel.KPINode, sdParameterValueMap *any) bool {
	numericLEQAtomKPINode := kpiNode.(*sharedModel.NumericLEQAtomKPINode)
	actualSDParameterValue := getTargetDataItemValue(sdParameterValueMap, numericLEQAtomKPINode.SDParameterSpecification).(float64)
	return actualSDParameterValue <= numericLEQAtomKPINode.ReferenceValue
}

func getTargetDataItemValue(sdParameterValueMap *any, sdParameterSpecification string) any {
	return (*sdParameterValueMap).(map[string]any)[sdParameterSpecification]
}

func (_ *logicalOperationKPINodeFulfillmentChecker) checkNodeFulfillment(kpiNode sharedModel.KPINode, sdParameterValueMap *any) bool {
	logicalOperationKPINode := kpiNode.(*sharedModel.LogicalOperationKPINode)
	switch logicalOperationKPINode.Type {
	case sharedModel.AND:
		return cUtil.All(logicalOperationKPINode.ChildNodes, func(node sharedModel.KPINode) bool {
			return checkKPINodeFulfillment(node, sdParameterValueMap)
		})
	case sharedModel.OR:
		return cUtil.Any(logicalOperationKPINode.ChildNodes, func(node sharedModel.KPINode) bool {
			return checkKPINodeFulfillment(node, sdParameterValueMap)
		})
	case sharedModel.NOR:
		return cUtil.All(logicalOperationKPINode.ChildNodes, func(node sharedModel.KPINode) bool {
			return !checkKPINodeFulfillment(node, sdParameterValueMap)
		})
	default:
		panic(fmt.Errorf("unsupported type of logical operation: %s", logicalOperationKPINode.Type))
	}
}
