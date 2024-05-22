package sharedModel

type LogicalOperationNodeType string

const (
	AND LogicalOperationNodeType = "AND"
	OR  LogicalOperationNodeType = "OR"
	NOR LogicalOperationNodeType = "NOR"
)

type KPINodeType string

const (
	StringEQAtom     KPINodeType = "string_eq_atom"
	BooleanEQAtom    KPINodeType = "boolean_eq_atom"
	NumericEQAtom    KPINodeType = "numeric_eq_atom"
	NumericGTAtom    KPINodeType = "numeric_gt_atom"
	NumericGEQAtom   KPINodeType = "numeric_geq_atom"
	NumericLTAtom    KPINodeType = "numeric_lt_atom"
	NumericLEQAtom   KPINodeType = "numeric_leq_atom"
	LogicalOperation KPINodeType = "logical_operation"
)

type SDInstanceMode string

const (
	ALL      SDInstanceMode = "all"
	SELECTED SDInstanceMode = "selected"
)

type KPIDefinition struct {
	ID                     *uint32        `json:"id,omitempty"`
	SDTypeID               uint32         `json:"sdTypeID"`
	SDTypeSpecification    string         `json:"sdTypeSpecification"`
	UserIdentifier         string         `json:"userIdentifier"`
	RootNode               KPINode        `json:"rootNode"`
	SDInstanceMode         SDInstanceMode `json:"sdInstanceMode"`
	SelectedSDInstanceUIDs []string       `json:"selectedSDInstanceUIDs"`
}

type KPINode interface {
	GetType() KPINodeType
}

type StringEQAtomKPINode struct {
	SDParameterID            uint32 `json:"sdParameterID"`
	SDParameterSpecification string `json:"sdParameterSpecification"`
	ReferenceValue           string `json:"referenceValue"`
}

func (*StringEQAtomKPINode) GetType() KPINodeType {
	return StringEQAtom
}

type BooleanEQAtomKPINode struct {
	SDParameterID            uint32 `json:"sdParameterID"`
	SDParameterSpecification string `json:"sdParameterSpecification"`
	ReferenceValue           bool   `json:"referenceValue"`
}

func (*BooleanEQAtomKPINode) GetType() KPINodeType {
	return BooleanEQAtom
}

type NumericEQAtomKPINode struct {
	SDParameterID            uint32  `json:"sdParameterID"`
	SDParameterSpecification string  `json:"sdParameterSpecification"`
	ReferenceValue           float64 `json:"referenceValue"`
}

func (*NumericEQAtomKPINode) GetType() KPINodeType {
	return NumericEQAtom
}

type NumericGTAtomKPINode struct {
	SDParameterID            uint32  `json:"sdParameterID"`
	SDParameterSpecification string  `json:"sdParameterSpecification"`
	ReferenceValue           float64 `json:"referenceValue"`
}

func (*NumericGTAtomKPINode) GetType() KPINodeType {
	return NumericGTAtom
}

type NumericGEQAtomKPINode struct {
	SDParameterID            uint32  `json:"sdParameterID"`
	SDParameterSpecification string  `json:"sdParameterSpecification"`
	ReferenceValue           float64 `json:"referenceValue"`
}

func (*NumericGEQAtomKPINode) GetType() KPINodeType {
	return NumericGEQAtom
}

type NumericLTAtomKPINode struct {
	SDParameterID            uint32  `json:"sdParameterID"`
	SDParameterSpecification string  `json:"sdParameterSpecification"`
	ReferenceValue           float64 `json:"referenceValue"`
}

func (*NumericLTAtomKPINode) GetType() KPINodeType {
	return NumericLTAtom
}

type NumericLEQAtomKPINode struct {
	SDParameterID            uint32  `json:"sdParameterID"`
	SDParameterSpecification string  `json:"sdParameterSpecification"`
	ReferenceValue           float64 `json:"referenceValue"`
}

func (*NumericLEQAtomKPINode) GetType() KPINodeType {
	return NumericLEQAtom
}

type LogicalOperationKPINode struct {
	Type       LogicalOperationNodeType `json:"type"`
	ChildNodes []KPINode                `json:"childNodes"`
}

func (*LogicalOperationKPINode) GetType() KPINodeType {
	return LogicalOperation
}
