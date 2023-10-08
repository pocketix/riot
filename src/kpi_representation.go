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

func (r *RootKPIDefinition) isFulfilled(deviceParameters interface{}) bool {
	return r.DefinitionRoot.isFulfilled(deviceParameters)
}

type Node interface {
	isFulfilled(deviceParameters interface{}) bool
}

type SubKPIDefinitionBaseNode struct {
	DeviceParameterSpecification string
}

type StringEqualitySubKPIDefinitionNode struct {
	SubKPIDefinitionBaseNode
	ReferenceValue string
}

func (s *StringEqualitySubKPIDefinitionNode) isFulfilled(deviceParameters interface{}) bool {

	return getDeviceParameterValue(deviceParameters, s.DeviceParameterSpecification).(string) == s.ReferenceValue
}

type NumericLessThanSubKPIDefinitionNode struct {
	SubKPIDefinitionBaseNode
	ReferenceValue float64
}

func (n *NumericLessThanSubKPIDefinitionNode) isFulfilled(deviceParameters interface{}) bool {

	return getDeviceParameterValue(deviceParameters, n.DeviceParameterSpecification).(float64) < n.ReferenceValue
}

type NumericGreaterThanSubKPIDefinitionNode struct {
	SubKPIDefinitionBaseNode
	ReferenceValue float64
}

func (n *NumericGreaterThanSubKPIDefinitionNode) isFulfilled(deviceParameters interface{}) bool {

	return getDeviceParameterValue(deviceParameters, n.DeviceParameterSpecification).(float64) > n.ReferenceValue
}

type NumericEqualitySubKPIDefinitionNode struct {
	SubKPIDefinitionBaseNode
	ReferenceValue float64
}

func (n *NumericEqualitySubKPIDefinitionNode) isFulfilled(deviceParameters interface{}) bool {

	return getDeviceParameterValue(deviceParameters, n.DeviceParameterSpecification).(float64) == n.ReferenceValue
}

type NumericInRangeSubKPIDefinitionNode struct {
	SubKPIDefinitionBaseNode
	LowerBoundaryValue float64
	UpperBoundaryValue float64
}

func (n *NumericInRangeSubKPIDefinitionNode) isFulfilled(deviceParameters interface{}) bool {

	deviceParameterValue := getDeviceParameterValue(deviceParameters, n.DeviceParameterSpecification).(float64)
	return deviceParameterValue > n.LowerBoundaryValue && deviceParameterValue < n.UpperBoundaryValue
}

type LogicalOperatorNode struct {
	Type       LogicalOperatorNodeType
	ChildNodes []Node
}

func (l *LogicalOperatorNode) isFulfilled(deviceParameters interface{}) bool {

	if l.Type == AND {
		for _, child := range l.ChildNodes {
			if !child.isFulfilled(deviceParameters) {
				return false
			}
		}
		return true
	} else { // OR
		for _, child := range l.ChildNodes {
			if child.isFulfilled(deviceParameters) {
				return true
			}
		}
		return false
	}
}

func getDeviceParameterValue(deviceParameters interface{}, deviceParameterSpecification string) interface{} {

	return deviceParameters.(map[string]interface{})[deviceParameterSpecification]
}

// GetRootKPIDefinitions is a function useful to get a data set of pre-made, artificial KPI definitions...
func GetRootKPIDefinitions() []RootKPIDefinition {

	rootKPIDefinitionObject1 := RootKPIDefinition{
		DeviceTypeSpecification:  "shelly1pro",
		HumanReadableDescription: "The relay NO. 0 temperature of devices belonging to device type shelly1pro must be between 20°C and 24°C and the relay NO. 0 source of such devices must equal 'WS_in'",
		DefinitionRoot: &LogicalOperatorNode{
			Type: AND,
			ChildNodes: []Node{
				&NumericInRangeSubKPIDefinitionNode{
					SubKPIDefinitionBaseNode: SubKPIDefinitionBaseNode{
						DeviceParameterSpecification: "relay_0_temperature",
					},
					LowerBoundaryValue: 20,
					UpperBoundaryValue: 24,
				},
				&StringEqualitySubKPIDefinitionNode{
					SubKPIDefinitionBaseNode: SubKPIDefinitionBaseNode{
						DeviceParameterSpecification: "relay_0_source",
					},
					ReferenceValue: "WS_in",
				},
			},
		},
	}

	rootKPIDefinitionObject2 := RootKPIDefinition{
		DeviceTypeSpecification:  "shelly1pro",
		HumanReadableDescription: "The value of 'model_name' device parameter of devices belonging to device type shelly1pro must equal 'shelly1pro'",
		DefinitionRoot: &StringEqualitySubKPIDefinitionNode{
			SubKPIDefinitionBaseNode: SubKPIDefinitionBaseNode{
				DeviceParameterSpecification: "model_name",
			},
			ReferenceValue: "shelly1pro",
		},
	}

	return []RootKPIDefinition{rootKPIDefinitionObject1, rootKPIDefinitionObject2}
}
