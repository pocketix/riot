package main

type LogicalOperatorNodeType string

const (
	AND LogicalOperatorNodeType = "AND"
	OR  LogicalOperatorNodeType = "OR"
)

type RootKPIDefinition struct {
	DeviceTypeSpecification  string
	HumanReadableDescription string
	DefinitionRoot           Node
}

func (r *RootKPIDefinition) isFulfilled(device Device) bool {
	return r.DefinitionRoot.isFulfilled(device)
}

type Node interface {
	isFulfilled(device Device) bool
}

type SubKPIDefinitionBaseNode struct {
	DeviceParameterSpecification string
}

type StringEqualitySubKPIDefinitionNode struct {
	SubKPIDefinitionBaseNode
	ReferenceValue string
}

func (s *StringEqualitySubKPIDefinitionNode) isFulfilled(device Device) bool {

	return getDeviceParameterValue(device, s.DeviceParameterSpecification).(string) == s.ReferenceValue
}

type NumericLessThanSubKPIDefinitionNode struct {
	SubKPIDefinitionBaseNode
	ReferenceValue float64
}

func (n *NumericLessThanSubKPIDefinitionNode) isFulfilled(device Device) bool {

	return getDeviceParameterValue(device, n.DeviceParameterSpecification).(float64) < n.ReferenceValue
}

type NumericGreaterThanSubKPIDefinitionNode struct {
	SubKPIDefinitionBaseNode
	ReferenceValue float64
}

func (n *NumericGreaterThanSubKPIDefinitionNode) isFulfilled(device Device) bool {

	return getDeviceParameterValue(device, n.DeviceParameterSpecification).(float64) > n.ReferenceValue
}

type NumericEqualitySubKPIDefinitionNode struct {
	SubKPIDefinitionBaseNode
	ReferenceValue float64
}

func (n *NumericEqualitySubKPIDefinitionNode) isFulfilled(device Device) bool {

	return getDeviceParameterValue(device, n.DeviceParameterSpecification).(float64) == n.ReferenceValue
}

type NumericInRangeSubKPIDefinitionNode struct {
	SubKPIDefinitionBaseNode
	LowerBoundaryValue float64
	UpperBoundaryValue float64
}

func (n *NumericInRangeSubKPIDefinitionNode) isFulfilled(device Device) bool {

	deviceParameterValue := getDeviceParameterValue(device, n.DeviceParameterSpecification).(float64)
	return deviceParameterValue > n.LowerBoundaryValue && deviceParameterValue < n.UpperBoundaryValue
}

type LogicalOperatorNode struct {
	Type       LogicalOperatorNodeType
	ChildNodes []Node
}

func (l *LogicalOperatorNode) isFulfilled(device Device) bool {

	if l.Type == AND {
		for _, child := range l.ChildNodes {
			if !child.isFulfilled(device) {
				return false
			}
		}
		return true
	} else { // OR
		for _, child := range l.ChildNodes {
			if child.isFulfilled(device) {
				return true
			}
		}
		return false
	}
}

func getDeviceParameterValue(device Device, deviceParameterSpecification string) interface{} {

	return device.DeviceParameters.(map[string]interface{})[deviceParameterSpecification]
}
