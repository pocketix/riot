package middleware

import (
	"bp-bures-SfPDfSD/src/dto"
	"fmt"
)

func CheckKPIFulfillment(kpiDefinitionDTO dto.KPIDefinitionDTO, deviceParameters *interface{}) bool {

	definitionRootNode := kpiDefinitionDTO.DefinitionRootNode
	return getCheckerForNode(definitionRootNode).checkNodeFulfillment(definitionRootNode, deviceParameters)
}

type nodeFulfillmentChecker interface {
	checkNodeFulfillment(node dto.FulfillableNode, deviceParameters *interface{}) bool
}

func getCheckerForNode(node dto.FulfillableNode) nodeFulfillmentChecker {

	switch node.(type) {
	case *dto.StringEqualitySubKPIDefinitionNodeDTO:
		return &stringEqualityFulfillmentChecker{}
	case *dto.NumericLessThanSubKPIDefinitionNodeDTO:
		return &numericLessThanFulfillmentChecker{}
	case *dto.NumericGreaterThanSubKPIDefinitionNodeDTO:
		return &numericGreaterThanFulfillmentChecker{}
	case *dto.NumericEqualitySubKPIDefinitionNodeDTO:
		return &numericEqualityFulfillmentChecker{}
	case *dto.NumericInRangeSubKPIDefinitionNodeDTO:
		return &numericInRangeFulfillmentChecker{}
	case *dto.BooleanEqualitySubKPIDefinitionNodeDTO:
		return &booleanEqualityFulfillmentChecker{}
	case *dto.LogicalOperatorNodeDTO:
		return &logicalOperatorNodeFulfillmentChecker{}
	}

	return nil
}

type stringEqualityFulfillmentChecker struct{}
type numericLessThanFulfillmentChecker struct{}
type numericGreaterThanFulfillmentChecker struct{}
type numericEqualityFulfillmentChecker struct{}
type numericInRangeFulfillmentChecker struct{}
type booleanEqualityFulfillmentChecker struct{}
type logicalOperatorNodeFulfillmentChecker struct{}

func (_ *stringEqualityFulfillmentChecker) checkNodeFulfillment(node dto.FulfillableNode, deviceParameters *interface{}) bool {

	n := node.(dto.StringEqualitySubKPIDefinitionNodeDTO)
	return getDeviceParameterValue(deviceParameters, n.DeviceParameterSpecification).(string) == n.ReferenceValue
}

func (_ *numericLessThanFulfillmentChecker) checkNodeFulfillment(node dto.FulfillableNode, deviceParameters *interface{}) bool {

	n := node.(dto.NumericLessThanSubKPIDefinitionNodeDTO)
	return getDeviceParameterValue(deviceParameters, n.DeviceParameterSpecification).(float64) < n.ReferenceValue
}

func (_ *numericGreaterThanFulfillmentChecker) checkNodeFulfillment(node dto.FulfillableNode, deviceParameters *interface{}) bool {

	n := node.(dto.NumericGreaterThanSubKPIDefinitionNodeDTO)
	return getDeviceParameterValue(deviceParameters, n.DeviceParameterSpecification).(float64) > n.ReferenceValue
}

func (_ *numericEqualityFulfillmentChecker) checkNodeFulfillment(node dto.FulfillableNode, deviceParameters *interface{}) bool {

	n := node.(dto.NumericEqualitySubKPIDefinitionNodeDTO)
	return getDeviceParameterValue(deviceParameters, n.DeviceParameterSpecification).(float64) == n.ReferenceValue
}

func (_ *numericInRangeFulfillmentChecker) checkNodeFulfillment(node dto.FulfillableNode, deviceParameters *interface{}) bool {

	n := node.(dto.NumericInRangeSubKPIDefinitionNodeDTO)
	deviceParameterValue := getDeviceParameterValue(deviceParameters, n.DeviceParameterSpecification).(float64)
	return deviceParameterValue > n.LowerBoundaryValue && deviceParameterValue < n.UpperBoundaryValue
}

func (_ *booleanEqualityFulfillmentChecker) checkNodeFulfillment(node dto.FulfillableNode, deviceParameters *interface{}) bool {

	n := node.(dto.BooleanEqualitySubKPIDefinitionNodeDTO)
	return getDeviceParameterValue(deviceParameters, n.DeviceParameterSpecification).(bool) == n.ReferenceValue
}

func (_ *logicalOperatorNodeFulfillmentChecker) checkNodeFulfillment(node dto.FulfillableNode, deviceParameters *interface{}) bool {

	allNodesFulfilled := func(nodes []dto.FulfillableNode, deviceParameters *interface{}) bool {
		for _, child := range nodes {
			if !getCheckerForNode(child).checkNodeFulfillment(child, deviceParameters) {
				return false
			}
		}
		return true
	}

	anyNodeFulfilled := func(nodes []dto.FulfillableNode, deviceParameters *interface{}) bool {
		for _, child := range nodes {
			if getCheckerForNode(child).checkNodeFulfillment(child, deviceParameters) {
				return true
			}
		}
		return false
	}

	n := node.(dto.LogicalOperatorNodeDTO)

	switch n.Type {
	case dto.AND:
		return allNodesFulfilled(n.ChildNodes, deviceParameters)
	case dto.OR:
		return anyNodeFulfilled(n.ChildNodes, deviceParameters)
	case dto.NOR:
		return !anyNodeFulfilled(n.ChildNodes, deviceParameters)
	default:
		panic(fmt.Sprintf("Unsupported LogicalOperatorNodeType: %s", n.Type))
	}
}

func getDeviceParameterValue(deviceParameters *interface{}, deviceParameterSpecification string) interface{} {

	return (*deviceParameters).(map[string]interface{})[deviceParameterSpecification]
}
