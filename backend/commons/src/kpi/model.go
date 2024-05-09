package kpi

import "github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"

type LogicalOperationNodeType string

const (
	AND LogicalOperationNodeType = "AND"
	OR  LogicalOperationNodeType = "OR"
	NOR LogicalOperationNodeType = "NOR"
)

type DefinitionDTO struct {
	ID                  util.Optional[uint32]
	SDTypeID            uint32
	SDTypeSpecification string
	UserIdentifier      string
	RootNode            NodeDTO
}

type NodeDTO any

type EQAtomNodeDTO[T any] struct {
	SDParameterID            uint32
	SDParameterSpecification string
	ReferenceValue           T
}

type NumericGTAtomNodeDTO struct {
	SDParameterID            uint32
	SDParameterSpecification string
	ReferenceValue           float64
}

type NumericGEQAtomNodeDTO struct {
	SDParameterID            uint32
	SDParameterSpecification string
	ReferenceValue           float64
}

type NumericLTAtomNodeDTO struct {
	SDParameterID            uint32
	SDParameterSpecification string
	ReferenceValue           float64
}

type NumericLEQAtomNodeDTO struct {
	SDParameterID            uint32
	SDParameterSpecification string
	ReferenceValue           float64
}

type LogicalOperationNodeDTO struct {
	Type       LogicalOperationNodeType
	ChildNodes []NodeDTO
}
