package kpi

type LogicalOperationNodeType string

const (
	AND LogicalOperationNodeType = "AND"
	OR  LogicalOperationNodeType = "OR"
	NOR LogicalOperationNodeType = "NOR"
)

type DefinitionDTO struct {
	SDTypeSpecification string
	UserIdentifier      string
	RootNode            NodeDTO
}

type NodeDTO interface{}

type EQAtomNodeDTO[T any] struct {
	SDParameterSpecification string
	ReferenceValue           T
}

type NumericGTAtomNodeDTO struct {
	SDParameterSpecification string
	ReferenceValue           float64
}

type NumericGEQAtomNodeDTO struct {
	SDParameterSpecification string
	ReferenceValue           float64
}

type NumericLTAtomNodeDTO struct {
	SDParameterSpecification string
	ReferenceValue           float64
}

type NumericLEQAtomNodeDTO struct {
	SDParameterSpecification string
	ReferenceValue           float64
}

type LogicalOperationNodeDTO struct {
	Type       LogicalOperationNodeType
	ChildNodes []NodeDTO
}
