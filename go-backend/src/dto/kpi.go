package dto

type LogicalOperatorNodeType string

const (
	AND LogicalOperatorNodeType = "AND"
	OR  LogicalOperatorNodeType = "OR"
	NOR LogicalOperatorNodeType = "NOR"
)

type KPIDefinitionDTO struct {
	DeviceTypeSpecification  string
	HumanReadableDescription string
	DefinitionRootNode       FulfillableNode
}

type FulfillableNode interface{}

type SubKPIDefinitionBaseNodeDTO struct {
	DeviceParameterSpecification string
}

type StringEqualitySubKPIDefinitionNodeDTO struct {
	SubKPIDefinitionBaseNodeDTO
	ReferenceValue string
}

type NumericLessThanSubKPIDefinitionNodeDTO struct {
	SubKPIDefinitionBaseNodeDTO
	ReferenceValue float64
}

type NumericGreaterThanSubKPIDefinitionNodeDTO struct {
	SubKPIDefinitionBaseNodeDTO
	ReferenceValue float64
}

type NumericEqualitySubKPIDefinitionNodeDTO struct {
	SubKPIDefinitionBaseNodeDTO
	ReferenceValue float64
}

type NumericInRangeSubKPIDefinitionNodeDTO struct {
	SubKPIDefinitionBaseNodeDTO
	LowerBoundaryValue float64
	UpperBoundaryValue float64
}

type BooleanEqualitySubKPIDefinitionNodeDTO struct {
	SubKPIDefinitionBaseNodeDTO
	ReferenceValue bool
}

type LogicalOperatorNodeDTO struct {
	Type       LogicalOperatorNodeType
	ChildNodes []FulfillableNode
}
