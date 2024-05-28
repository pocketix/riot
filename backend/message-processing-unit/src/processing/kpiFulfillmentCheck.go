package processing

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedModel"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/sharedUtils"
)

func CheckKPIFulfillment(kpiDefinition sharedModel.KPIDefinition, sdParameterValueMap *any) sharedUtils.Result[bool] {
	return checkKPINodeFulfillment(kpiDefinition.RootNode, sdParameterValueMap)
}

func checkKPINodeFulfillment(kpiNode sharedModel.KPINode, sdParameterValueMap *any) sharedUtils.Result[bool] {
	return getCheckerForKPINode(kpiNode).checkNodeFulfillment(kpiNode, sdParameterValueMap)
}

type kpiNodeFulfillmentChecker interface {
	checkNodeFulfillment(kpiNode sharedModel.KPINode, sdParameterValueMap *any) sharedUtils.Result[bool]
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

func (_ *stringEQKPINodeFulfillmentChecker) checkNodeFulfillment(kpiNode sharedModel.KPINode, sdParameterValueMap *any) sharedUtils.Result[bool] {
	stringEQAtomKPINode := kpiNode.(*sharedModel.StringEQAtomKPINode)
	actualSDParameterValueResult := getSDParameterValue[string](sdParameterValueMap, stringEQAtomKPINode.SDParameterSpecification)
	if actualSDParameterValueResult.IsFailure() {
		return sharedUtils.NewFailureResult[bool](actualSDParameterValueResult.GetError())
	}
	return sharedUtils.NewSuccessResult[bool](actualSDParameterValueResult.GetPayload() == stringEQAtomKPINode.ReferenceValue)
}

func (_ *booleanEQKPINodeFulfillmentChecker) checkNodeFulfillment(kpiNode sharedModel.KPINode, sdParameterValueMap *any) sharedUtils.Result[bool] {
	booleanEQAtomKPINode := kpiNode.(*sharedModel.BooleanEQAtomKPINode)
	actualSDParameterValueResult := getSDParameterValue[bool](sdParameterValueMap, booleanEQAtomKPINode.SDParameterSpecification)
	if actualSDParameterValueResult.IsFailure() {
		return sharedUtils.NewFailureResult[bool](actualSDParameterValueResult.GetError())
	}
	return sharedUtils.NewSuccessResult[bool](actualSDParameterValueResult.GetPayload() == booleanEQAtomKPINode.ReferenceValue)
}

func (_ *numericEQKPINodeFulfillmentChecker) checkNodeFulfillment(kpiNode sharedModel.KPINode, sdParameterValueMap *any) sharedUtils.Result[bool] {
	numericEQAtomKPINode := kpiNode.(*sharedModel.NumericEQAtomKPINode)
	actualSDParameterValueResult := getSDParameterValue[float64](sdParameterValueMap, numericEQAtomKPINode.SDParameterSpecification)
	if actualSDParameterValueResult.IsFailure() {
		return sharedUtils.NewFailureResult[bool](actualSDParameterValueResult.GetError())
	}
	return sharedUtils.NewSuccessResult[bool](actualSDParameterValueResult.GetPayload() == numericEQAtomKPINode.ReferenceValue)
}

func (_ *numericGTKPINodeFulfillmentChecker) checkNodeFulfillment(kpiNode sharedModel.KPINode, sdParameterValueMap *any) sharedUtils.Result[bool] {
	numericGTAtomKPINode := kpiNode.(*sharedModel.NumericGTAtomKPINode)
	actualSDParameterValueResult := getSDParameterValue[float64](sdParameterValueMap, numericGTAtomKPINode.SDParameterSpecification)
	if actualSDParameterValueResult.IsFailure() {
		return sharedUtils.NewFailureResult[bool](actualSDParameterValueResult.GetError())
	}
	return sharedUtils.NewSuccessResult[bool](actualSDParameterValueResult.GetPayload() > numericGTAtomKPINode.ReferenceValue)
}

func (_ *numericGEQKPINodeFulfillmentChecker) checkNodeFulfillment(kpiNode sharedModel.KPINode, sdParameterValueMap *any) sharedUtils.Result[bool] {
	numericGEQAtomKPINode := kpiNode.(*sharedModel.NumericGEQAtomKPINode)
	actualSDParameterValueResult := getSDParameterValue[float64](sdParameterValueMap, numericGEQAtomKPINode.SDParameterSpecification)
	if actualSDParameterValueResult.IsFailure() {
		return sharedUtils.NewFailureResult[bool](actualSDParameterValueResult.GetError())
	}
	return sharedUtils.NewSuccessResult[bool](actualSDParameterValueResult.GetPayload() >= numericGEQAtomKPINode.ReferenceValue)
}

func (_ *numericLTKPINodeFulfillmentChecker) checkNodeFulfillment(kpiNode sharedModel.KPINode, sdParameterValueMap *any) sharedUtils.Result[bool] {
	numericLTAtomKPINode := kpiNode.(*sharedModel.NumericLTAtomKPINode)
	actualSDParameterValueResult := getSDParameterValue[float64](sdParameterValueMap, numericLTAtomKPINode.SDParameterSpecification)
	if actualSDParameterValueResult.IsFailure() {
		return sharedUtils.NewFailureResult[bool](actualSDParameterValueResult.GetError())
	}
	return sharedUtils.NewSuccessResult[bool](actualSDParameterValueResult.GetPayload() < numericLTAtomKPINode.ReferenceValue)
}

func (_ *numericLEQKPINodeFulfillmentChecker) checkNodeFulfillment(kpiNode sharedModel.KPINode, sdParameterValueMap *any) sharedUtils.Result[bool] {
	numericLEQAtomKPINode := kpiNode.(*sharedModel.NumericLEQAtomKPINode)
	actualSDParameterValueResult := getSDParameterValue[float64](sdParameterValueMap, numericLEQAtomKPINode.SDParameterSpecification)
	if actualSDParameterValueResult.IsFailure() {
		return sharedUtils.NewFailureResult[bool](actualSDParameterValueResult.GetError())
	}
	return sharedUtils.NewSuccessResult[bool](actualSDParameterValueResult.GetPayload() <= numericLEQAtomKPINode.ReferenceValue)
}

func getSDParameterValue[T any](sdParameterValueMap *any, sdParameterSpecification string) sharedUtils.Result[T] {
	sdParameterValue, exists := (*sdParameterValueMap).(map[string]any)[sdParameterSpecification]
	if exists {
		if !sharedUtils.TypeIs[T](sdParameterValue) {
			return sharedUtils.NewFailureResult[T](fmt.Errorf("the actual SD parameter '%s' is of different type that the one specified", sdParameterSpecification))
		}
		return sharedUtils.NewSuccessResult[T](sdParameterValue.(T))
	} else {
		return sharedUtils.NewFailureResult[T](fmt.Errorf("the parameter specification '%s' is not among the actual SD parameters", sdParameterSpecification))
	}
}

func (_ *logicalOperationKPINodeFulfillmentChecker) checkNodeFulfillment(kpiNode sharedModel.KPINode, sdParameterValueMap *any) sharedUtils.Result[bool] {
	logicalOperationKPINode := kpiNode.(*sharedModel.LogicalOperationKPINode)
	switch logicalOperationKPINode.Type {
	case sharedModel.AND:
		for _, node := range logicalOperationKPINode.ChildNodes {
			kpiNodeFulfillmentResult := checkKPINodeFulfillment(node, sdParameterValueMap)
			if kpiNodeFulfillmentResult.IsFailure() {
				return sharedUtils.NewFailureResult[bool](kpiNodeFulfillmentResult.GetError())
			}
			if kpiNodeFulfillment := kpiNodeFulfillmentResult.GetPayload(); !kpiNodeFulfillment {
				return sharedUtils.NewSuccessResult[bool](false)
			}
		}
		return sharedUtils.NewSuccessResult[bool](true)
	case sharedModel.OR:
		for _, node := range logicalOperationKPINode.ChildNodes {
			kpiNodeFulfillmentResult := checkKPINodeFulfillment(node, sdParameterValueMap)
			if kpiNodeFulfillmentResult.IsFailure() {
				return sharedUtils.NewFailureResult[bool](kpiNodeFulfillmentResult.GetError())
			}
			if kpiNodeFulfillment := kpiNodeFulfillmentResult.GetPayload(); kpiNodeFulfillment {
				return sharedUtils.NewSuccessResult[bool](true)
			}
		}
		return sharedUtils.NewSuccessResult[bool](false)
	case sharedModel.NOR:
		for _, node := range logicalOperationKPINode.ChildNodes {
			kpiNodeFulfillmentResult := checkKPINodeFulfillment(node, sdParameterValueMap)
			if kpiNodeFulfillmentResult.IsFailure() {
				return sharedUtils.NewFailureResult[bool](kpiNodeFulfillmentResult.GetError())
			}
			if kpiNodeFulfillment := kpiNodeFulfillmentResult.GetPayload(); kpiNodeFulfillment {
				return sharedUtils.NewSuccessResult[bool](false)
			}
		}
		return sharedUtils.NewSuccessResult[bool](true)
	default:
		panic(fmt.Errorf("unsupported type of logical operation: %s", logicalOperationKPINode.Type))
	}
}
