// Code generated by github.com/99designs/gqlgen, DO NOT EDIT.

package graphQLModel

import (
	"fmt"
	"io"
	"strconv"
)

type AtomKPINode interface {
	GetID() uint32
	GetParentNodeID() *uint32
	GetNodeType() KPINodeType
	GetSdParameterID() uint32
	GetSdParameterSpecification() string
}

type KPINode interface {
	GetID() uint32
	GetParentNodeID() *uint32
	GetNodeType() KPINodeType
}

type BooleanEQAtomKPINode struct {
	ID                       uint32      `json:"id"`
	ParentNodeID             *uint32     `json:"parentNodeID,omitempty"`
	NodeType                 KPINodeType `json:"nodeType"`
	SdParameterID            uint32      `json:"sdParameterID"`
	SdParameterSpecification string      `json:"sdParameterSpecification"`
	BooleanReferenceValue    bool        `json:"booleanReferenceValue"`
}

func (BooleanEQAtomKPINode) IsKPINode()                    {}
func (this BooleanEQAtomKPINode) GetID() uint32            { return this.ID }
func (this BooleanEQAtomKPINode) GetParentNodeID() *uint32 { return this.ParentNodeID }
func (this BooleanEQAtomKPINode) GetNodeType() KPINodeType { return this.NodeType }

func (BooleanEQAtomKPINode) IsAtomKPINode() {}

func (this BooleanEQAtomKPINode) GetSdParameterID() uint32 { return this.SdParameterID }
func (this BooleanEQAtomKPINode) GetSdParameterSpecification() string {
	return this.SdParameterSpecification
}

type InputData struct {
	Time       string  `json:"time"`
	DeviceID   string  `json:"deviceId"`
	DeviceType *string `json:"deviceType,omitempty"`
	Data       string  `json:"data"`
}

type KPIDefinition struct {
	ID                     uint32         `json:"id"`
	SdTypeID               uint32         `json:"sdTypeID"`
	SdTypeSpecification    string         `json:"sdTypeSpecification"`
	UserIdentifier         string         `json:"userIdentifier"`
	Nodes                  []KPINode      `json:"nodes"`
	SdInstanceMode         SDInstanceMode `json:"sdInstanceMode"`
	SelectedSDInstanceUIDs []string       `json:"selectedSDInstanceUIDs"`
}

type KPIDefinitionInput struct {
	SdTypeID               uint32         `json:"sdTypeID"`
	SdTypeSpecification    string         `json:"sdTypeSpecification"`
	UserIdentifier         string         `json:"userIdentifier"`
	Nodes                  []KPINodeInput `json:"nodes"`
	SdInstanceMode         SDInstanceMode `json:"sdInstanceMode"`
	SelectedSDInstanceUIDs []string       `json:"selectedSDInstanceUIDs"`
}

type KPIFulfillmentCheckResult struct {
	KpiDefinitionID uint32 `json:"kpiDefinitionID"`
	SdInstanceID    uint32 `json:"sdInstanceID"`
	Fulfilled       bool   `json:"fulfilled"`
}

type KPIFulfillmentCheckResultTuple struct {
	KpiFulfillmentCheckResults []KPIFulfillmentCheckResult `json:"kpiFulfillmentCheckResults"`
}

type KPINodeInput struct {
	Type                     KPINodeType           `json:"type"`
	ID                       uint32                `json:"id"`
	ParentNodeID             *uint32               `json:"parentNodeID,omitempty"`
	SdParameterID            *uint32               `json:"sdParameterID,omitempty"`
	SdParameterSpecification *string               `json:"sdParameterSpecification,omitempty"`
	StringReferenceValue     *string               `json:"stringReferenceValue,omitempty"`
	BooleanReferenceValue    *bool                 `json:"booleanReferenceValue,omitempty"`
	NumericReferenceValue    *float64              `json:"numericReferenceValue,omitempty"`
	LogicalOperationType     *LogicalOperationType `json:"logicalOperationType,omitempty"`
}

type LogicalOperationKPINode struct {
	ID           uint32               `json:"id"`
	ParentNodeID *uint32              `json:"parentNodeID,omitempty"`
	NodeType     KPINodeType          `json:"nodeType"`
	Type         LogicalOperationType `json:"type"`
}

func (LogicalOperationKPINode) IsKPINode()                    {}
func (this LogicalOperationKPINode) GetID() uint32            { return this.ID }
func (this LogicalOperationKPINode) GetParentNodeID() *uint32 { return this.ParentNodeID }
func (this LogicalOperationKPINode) GetNodeType() KPINodeType { return this.NodeType }

type Mutation struct {
}

type NumericEQAtomKPINode struct {
	ID                       uint32      `json:"id"`
	ParentNodeID             *uint32     `json:"parentNodeID,omitempty"`
	NodeType                 KPINodeType `json:"nodeType"`
	SdParameterID            uint32      `json:"sdParameterID"`
	SdParameterSpecification string      `json:"sdParameterSpecification"`
	NumericReferenceValue    float64     `json:"numericReferenceValue"`
}

func (NumericEQAtomKPINode) IsKPINode()                    {}
func (this NumericEQAtomKPINode) GetID() uint32            { return this.ID }
func (this NumericEQAtomKPINode) GetParentNodeID() *uint32 { return this.ParentNodeID }
func (this NumericEQAtomKPINode) GetNodeType() KPINodeType { return this.NodeType }

func (NumericEQAtomKPINode) IsAtomKPINode() {}

func (this NumericEQAtomKPINode) GetSdParameterID() uint32 { return this.SdParameterID }
func (this NumericEQAtomKPINode) GetSdParameterSpecification() string {
	return this.SdParameterSpecification
}

type NumericGEQAtomKPINode struct {
	ID                       uint32      `json:"id"`
	ParentNodeID             *uint32     `json:"parentNodeID,omitempty"`
	NodeType                 KPINodeType `json:"nodeType"`
	SdParameterID            uint32      `json:"sdParameterID"`
	SdParameterSpecification string      `json:"sdParameterSpecification"`
	NumericReferenceValue    float64     `json:"numericReferenceValue"`
}

func (NumericGEQAtomKPINode) IsKPINode()                    {}
func (this NumericGEQAtomKPINode) GetID() uint32            { return this.ID }
func (this NumericGEQAtomKPINode) GetParentNodeID() *uint32 { return this.ParentNodeID }
func (this NumericGEQAtomKPINode) GetNodeType() KPINodeType { return this.NodeType }

func (NumericGEQAtomKPINode) IsAtomKPINode() {}

func (this NumericGEQAtomKPINode) GetSdParameterID() uint32 { return this.SdParameterID }
func (this NumericGEQAtomKPINode) GetSdParameterSpecification() string {
	return this.SdParameterSpecification
}

type NumericGTAtomKPINode struct {
	ID                       uint32      `json:"id"`
	ParentNodeID             *uint32     `json:"parentNodeID,omitempty"`
	NodeType                 KPINodeType `json:"nodeType"`
	SdParameterID            uint32      `json:"sdParameterID"`
	SdParameterSpecification string      `json:"sdParameterSpecification"`
	NumericReferenceValue    float64     `json:"numericReferenceValue"`
}

func (NumericGTAtomKPINode) IsKPINode()                    {}
func (this NumericGTAtomKPINode) GetID() uint32            { return this.ID }
func (this NumericGTAtomKPINode) GetParentNodeID() *uint32 { return this.ParentNodeID }
func (this NumericGTAtomKPINode) GetNodeType() KPINodeType { return this.NodeType }

func (NumericGTAtomKPINode) IsAtomKPINode() {}

func (this NumericGTAtomKPINode) GetSdParameterID() uint32 { return this.SdParameterID }
func (this NumericGTAtomKPINode) GetSdParameterSpecification() string {
	return this.SdParameterSpecification
}

type NumericLEQAtomKPINode struct {
	ID                       uint32      `json:"id"`
	ParentNodeID             *uint32     `json:"parentNodeID,omitempty"`
	NodeType                 KPINodeType `json:"nodeType"`
	SdParameterID            uint32      `json:"sdParameterID"`
	SdParameterSpecification string      `json:"sdParameterSpecification"`
	NumericReferenceValue    float64     `json:"numericReferenceValue"`
}

func (NumericLEQAtomKPINode) IsKPINode()                    {}
func (this NumericLEQAtomKPINode) GetID() uint32            { return this.ID }
func (this NumericLEQAtomKPINode) GetParentNodeID() *uint32 { return this.ParentNodeID }
func (this NumericLEQAtomKPINode) GetNodeType() KPINodeType { return this.NodeType }

func (NumericLEQAtomKPINode) IsAtomKPINode() {}

func (this NumericLEQAtomKPINode) GetSdParameterID() uint32 { return this.SdParameterID }
func (this NumericLEQAtomKPINode) GetSdParameterSpecification() string {
	return this.SdParameterSpecification
}

type NumericLTAtomKPINode struct {
	ID                       uint32      `json:"id"`
	ParentNodeID             *uint32     `json:"parentNodeID,omitempty"`
	NodeType                 KPINodeType `json:"nodeType"`
	SdParameterID            uint32      `json:"sdParameterID"`
	SdParameterSpecification string      `json:"sdParameterSpecification"`
	NumericReferenceValue    float64     `json:"numericReferenceValue"`
}

func (NumericLTAtomKPINode) IsKPINode()                    {}
func (this NumericLTAtomKPINode) GetID() uint32            { return this.ID }
func (this NumericLTAtomKPINode) GetParentNodeID() *uint32 { return this.ParentNodeID }
func (this NumericLTAtomKPINode) GetNodeType() KPINodeType { return this.NodeType }

func (NumericLTAtomKPINode) IsAtomKPINode() {}

func (this NumericLTAtomKPINode) GetSdParameterID() uint32 { return this.SdParameterID }
func (this NumericLTAtomKPINode) GetSdParameterSpecification() string {
	return this.SdParameterSpecification
}

type OutputData struct {
	Time       string  `json:"time"`
	DeviceID   string  `json:"deviceId"`
	DeviceType *string `json:"deviceType,omitempty"`
	Data       string  `json:"data"`
}

type Query struct {
}

type SDCommand struct {
	ID       uint32 `json:"id"`
	Name     string `json:"name"`
	Payload  string `json:"payload"`
	SdTypeID uint32 `json:"sdTypeId"`
}

type SDCommandInput struct {
	Name     string `json:"name"`
	Payload  string `json:"payload"`
	SdTypeID uint32 `json:"sdTypeId"`
}

type SDCommandInputWithoutType struct {
	Name    string `json:"name"`
	Payload string `json:"payload"`
}

type SDCommandInvocation struct {
	ID             uint32 `json:"id"`
	InvocationTime string `json:"invocationTime"`
	Payload        string `json:"payload"`
	UserID         uint32 `json:"userId"`
	CommandID      uint32 `json:"commandId"`
	SdInstanceID   uint32 `json:"sdInstanceId"`
}

type SDCommandInvocationInput struct {
	InvocationTime string `json:"invocationTime"`
	Payload        string `json:"payload"`
	UserID         uint32 `json:"userId"`
	CommandID      uint32 `json:"commandId"`
	SdInstanceID   uint32 `json:"sdInstanceId"`
}

type SDInstance struct {
	ID                 uint32                `json:"id"`
	UID                string                `json:"uid"`
	ConfirmedByUser    bool                  `json:"confirmedByUser"`
	UserIdentifier     string                `json:"userIdentifier"`
	Type               SDType                `json:"type"`
	ParameterSnapshots []SDParameterSnapshot `json:"parameterSnapshots,omitempty"`
	CommandInvocations []SDCommandInvocation `json:"commandInvocations"`
}

type SDInstanceGroup struct {
	ID             uint32   `json:"id"`
	UserIdentifier string   `json:"userIdentifier"`
	SdInstanceIDs  []uint32 `json:"sdInstanceIDs"`
}

type SDInstanceGroupInput struct {
	UserIdentifier string   `json:"userIdentifier"`
	SdInstanceIDs  []uint32 `json:"sdInstanceIDs"`
}

type SDInstanceUpdateInput struct {
	UserIdentifier  *string `json:"userIdentifier,omitempty"`
	ConfirmedByUser *bool   `json:"confirmedByUser,omitempty"`
}

type SDParameter struct {
	ID                 uint32                `json:"id"`
	Denotation         string                `json:"denotation"`
	Label              *string               `json:"label,omitempty"`
	Type               SDParameterType       `json:"type"`
	ParameterSnapshots []SDParameterSnapshot `json:"parameterSnapshots"`
}

type SDParameterInput struct {
	Denotation string          `json:"denotation"`
	Label      *string         `json:"label,omitempty"`
	Type       SDParameterType `json:"type"`
}

type SDParameterSnapshot struct {
	InstanceID  uint32   `json:"instanceId"`
	ParameterID uint32   `json:"parameterId"`
	String      *string  `json:"string,omitempty"`
	Number      *float64 `json:"number,omitempty"`
	Boolean     *bool    `json:"boolean,omitempty"`
	UpdatedAt   string   `json:"updatedAt"`
	VplPrograms []uint32 `json:"vplPrograms"`
}

type SDType struct {
	ID         uint32        `json:"id"`
	Denotation string        `json:"denotation"`
	Label      *string       `json:"label,omitempty"`
	Icon       *string       `json:"icon,omitempty"`
	Parameters []SDParameter `json:"parameters"`
	Commands   []SDCommand   `json:"commands"`
}

type SDTypeInput struct {
	Denotation string                      `json:"denotation"`
	Label      *string                     `json:"label,omitempty"`
	Icon       *string                     `json:"icon,omitempty"`
	Parameters []SDParameterInput          `json:"parameters"`
	Commands   []SDCommandInputWithoutType `json:"commands"`
}

type SensorField struct {
	Key    string   `json:"key"`
	Values []string `json:"values"`
}

type SensorsWithFields struct {
	Sensors []SensorField `json:"sensors"`
}

type SimpleSensors struct {
	Sensors []string `json:"sensors"`
}

// Data used for querying the selected bucket
type StatisticsInput struct {
	// Start of the querying window
	From *string `json:"from,omitempty"`
	// End of the querying window
	To *string `json:"to,omitempty"`
	// Amount of minutes to aggregate by
	// For example if the queried range has 1 hour and aggregateMinutes is set to 10 the aggregation will result in 6 points
	AggregateMinutes *int `json:"aggregateMinutes,omitempty"`
	// Timezone override default UTC.
	// For more details why and how this affects queries see: https://www.influxdata.com/blog/time-zones-in-flux/.
	// In most cases you can ignore this and some edge aggregations can be influenced.
	// If you need a precise result or the aggregation uses high amount of minutes provide the target time zone.
	Timezone *string `json:"timezone,omitempty"`
	// Aggregation operator to use, if needed
	Operation *StatisticsOperation `json:"operation,omitempty"`
}

type StringEQAtomKPINode struct {
	ID                       uint32      `json:"id"`
	ParentNodeID             *uint32     `json:"parentNodeID,omitempty"`
	NodeType                 KPINodeType `json:"nodeType"`
	SdParameterID            uint32      `json:"sdParameterID"`
	SdParameterSpecification string      `json:"sdParameterSpecification"`
	StringReferenceValue     string      `json:"stringReferenceValue"`
}

func (StringEQAtomKPINode) IsKPINode()                    {}
func (this StringEQAtomKPINode) GetID() uint32            { return this.ID }
func (this StringEQAtomKPINode) GetParentNodeID() *uint32 { return this.ParentNodeID }
func (this StringEQAtomKPINode) GetNodeType() KPINodeType { return this.NodeType }

func (StringEQAtomKPINode) IsAtomKPINode() {}

func (this StringEQAtomKPINode) GetSdParameterID() uint32 { return this.SdParameterID }
func (this StringEQAtomKPINode) GetSdParameterSpecification() string {
	return this.SdParameterSpecification
}

type Subscription struct {
}

type UserConfig struct {
	UserID uint32 `json:"userId"`
	Config string `json:"config"`
}

type UserConfigInput struct {
	Config string `json:"config"`
}

type VPLProgram struct {
	ID                   uint32                `json:"id"`
	Name                 string                `json:"name"`
	Data                 string                `json:"data"`
	LastRun              *string               `json:"lastRun,omitempty"`
	Enabled              bool                  `json:"enabled"`
	SdParameterSnapshots []SDParameterSnapshot `json:"sdParameterSnapshots"`
}

type VPLProgramExecutionResult struct {
	Program                      VPLProgram            `json:"program"`
	SdParameterSnapshotsToUpdate []SDParameterSnapshot `json:"sdParameterSnapshotsToUpdate"`
	SdCommandInvocations         []SDCommandInvocation `json:"SdCommandInvocations"`
	ExecutionTime                string                `json:"executionTime"`
	Enabled                      bool                  `json:"enabled"`
	Success                      bool                  `json:"success"`
	Error                        *string               `json:"error,omitempty"`
	ExecutionReason              *string               `json:"executionReason,omitempty"`
}

type KPINodeType string

const (
	KPINodeTypeStringEQAtom     KPINodeType = "StringEQAtom"
	KPINodeTypeBooleanEQAtom    KPINodeType = "BooleanEQAtom"
	KPINodeTypeNumericEQAtom    KPINodeType = "NumericEQAtom"
	KPINodeTypeNumericGTAtom    KPINodeType = "NumericGTAtom"
	KPINodeTypeNumericGEQAtom   KPINodeType = "NumericGEQAtom"
	KPINodeTypeNumericLTAtom    KPINodeType = "NumericLTAtom"
	KPINodeTypeNumericLEQAtom   KPINodeType = "NumericLEQAtom"
	KPINodeTypeLogicalOperation KPINodeType = "LogicalOperation"
)

var AllKPINodeType = []KPINodeType{
	KPINodeTypeStringEQAtom,
	KPINodeTypeBooleanEQAtom,
	KPINodeTypeNumericEQAtom,
	KPINodeTypeNumericGTAtom,
	KPINodeTypeNumericGEQAtom,
	KPINodeTypeNumericLTAtom,
	KPINodeTypeNumericLEQAtom,
	KPINodeTypeLogicalOperation,
}

func (e KPINodeType) IsValid() bool {
	switch e {
	case KPINodeTypeStringEQAtom, KPINodeTypeBooleanEQAtom, KPINodeTypeNumericEQAtom, KPINodeTypeNumericGTAtom, KPINodeTypeNumericGEQAtom, KPINodeTypeNumericLTAtom, KPINodeTypeNumericLEQAtom, KPINodeTypeLogicalOperation:
		return true
	}
	return false
}

func (e KPINodeType) String() string {
	return string(e)
}

func (e *KPINodeType) UnmarshalGQL(v any) error {
	str, ok := v.(string)
	if !ok {
		return fmt.Errorf("enums must be strings")
	}

	*e = KPINodeType(str)
	if !e.IsValid() {
		return fmt.Errorf("%s is not a valid KPINodeType", str)
	}
	return nil
}

func (e KPINodeType) MarshalGQL(w io.Writer) {
	fmt.Fprint(w, strconv.Quote(e.String()))
}

type LogicalOperationType string

const (
	LogicalOperationTypeAnd LogicalOperationType = "AND"
	LogicalOperationTypeOr  LogicalOperationType = "OR"
	LogicalOperationTypeNor LogicalOperationType = "NOR"
)

var AllLogicalOperationType = []LogicalOperationType{
	LogicalOperationTypeAnd,
	LogicalOperationTypeOr,
	LogicalOperationTypeNor,
}

func (e LogicalOperationType) IsValid() bool {
	switch e {
	case LogicalOperationTypeAnd, LogicalOperationTypeOr, LogicalOperationTypeNor:
		return true
	}
	return false
}

func (e LogicalOperationType) String() string {
	return string(e)
}

func (e *LogicalOperationType) UnmarshalGQL(v any) error {
	str, ok := v.(string)
	if !ok {
		return fmt.Errorf("enums must be strings")
	}

	*e = LogicalOperationType(str)
	if !e.IsValid() {
		return fmt.Errorf("%s is not a valid LogicalOperationType", str)
	}
	return nil
}

func (e LogicalOperationType) MarshalGQL(w io.Writer) {
	fmt.Fprint(w, strconv.Quote(e.String()))
}

type SDInstanceMode string

const (
	SDInstanceModeAll      SDInstanceMode = "ALL"
	SDInstanceModeSelected SDInstanceMode = "SELECTED"
)

var AllSDInstanceMode = []SDInstanceMode{
	SDInstanceModeAll,
	SDInstanceModeSelected,
}

func (e SDInstanceMode) IsValid() bool {
	switch e {
	case SDInstanceModeAll, SDInstanceModeSelected:
		return true
	}
	return false
}

func (e SDInstanceMode) String() string {
	return string(e)
}

func (e *SDInstanceMode) UnmarshalGQL(v any) error {
	str, ok := v.(string)
	if !ok {
		return fmt.Errorf("enums must be strings")
	}

	*e = SDInstanceMode(str)
	if !e.IsValid() {
		return fmt.Errorf("%s is not a valid SDInstanceMode", str)
	}
	return nil
}

func (e SDInstanceMode) MarshalGQL(w io.Writer) {
	fmt.Fprint(w, strconv.Quote(e.String()))
}

type SDParameterType string

const (
	SDParameterTypeString  SDParameterType = "STRING"
	SDParameterTypeNumber  SDParameterType = "NUMBER"
	SDParameterTypeBoolean SDParameterType = "BOOLEAN"
)

var AllSDParameterType = []SDParameterType{
	SDParameterTypeString,
	SDParameterTypeNumber,
	SDParameterTypeBoolean,
}

func (e SDParameterType) IsValid() bool {
	switch e {
	case SDParameterTypeString, SDParameterTypeNumber, SDParameterTypeBoolean:
		return true
	}
	return false
}

func (e SDParameterType) String() string {
	return string(e)
}

func (e *SDParameterType) UnmarshalGQL(v any) error {
	str, ok := v.(string)
	if !ok {
		return fmt.Errorf("enums must be strings")
	}

	*e = SDParameterType(str)
	if !e.IsValid() {
		return fmt.Errorf("%s is not a valid SDParameterType", str)
	}
	return nil
}

func (e SDParameterType) MarshalGQL(w io.Writer) {
	fmt.Fprint(w, strconv.Quote(e.String()))
}

type StatisticsOperation string

const (
	StatisticsOperationMean            StatisticsOperation = "mean"
	StatisticsOperationMin             StatisticsOperation = "min"
	StatisticsOperationMax             StatisticsOperation = "max"
	StatisticsOperationFirst           StatisticsOperation = "first"
	StatisticsOperationSum             StatisticsOperation = "sum"
	StatisticsOperationLast            StatisticsOperation = "last"
	StatisticsOperationNone            StatisticsOperation = "none"
	StatisticsOperationCount           StatisticsOperation = "count"
	StatisticsOperationIntegral        StatisticsOperation = "integral"
	StatisticsOperationMedian          StatisticsOperation = "median"
	StatisticsOperationMode            StatisticsOperation = "mode"
	StatisticsOperationQuantile        StatisticsOperation = "quantile"
	StatisticsOperationReduce          StatisticsOperation = "reduce"
	StatisticsOperationSkew            StatisticsOperation = "skew"
	StatisticsOperationSpread          StatisticsOperation = "spread"
	StatisticsOperationStddev          StatisticsOperation = "stddev"
	StatisticsOperationTimeweightedavg StatisticsOperation = "timeweightedavg"
)

var AllStatisticsOperation = []StatisticsOperation{
	StatisticsOperationMean,
	StatisticsOperationMin,
	StatisticsOperationMax,
	StatisticsOperationFirst,
	StatisticsOperationSum,
	StatisticsOperationLast,
	StatisticsOperationNone,
	StatisticsOperationCount,
	StatisticsOperationIntegral,
	StatisticsOperationMedian,
	StatisticsOperationMode,
	StatisticsOperationQuantile,
	StatisticsOperationReduce,
	StatisticsOperationSkew,
	StatisticsOperationSpread,
	StatisticsOperationStddev,
	StatisticsOperationTimeweightedavg,
}

func (e StatisticsOperation) IsValid() bool {
	switch e {
	case StatisticsOperationMean, StatisticsOperationMin, StatisticsOperationMax, StatisticsOperationFirst, StatisticsOperationSum, StatisticsOperationLast, StatisticsOperationNone, StatisticsOperationCount, StatisticsOperationIntegral, StatisticsOperationMedian, StatisticsOperationMode, StatisticsOperationQuantile, StatisticsOperationReduce, StatisticsOperationSkew, StatisticsOperationSpread, StatisticsOperationStddev, StatisticsOperationTimeweightedavg:
		return true
	}
	return false
}

func (e StatisticsOperation) String() string {
	return string(e)
}

func (e *StatisticsOperation) UnmarshalGQL(v any) error {
	str, ok := v.(string)
	if !ok {
		return fmt.Errorf("enums must be strings")
	}

	*e = StatisticsOperation(str)
	if !e.IsValid() {
		return fmt.Errorf("%s is not a valid StatisticsOperation", str)
	}
	return nil
}

func (e StatisticsOperation) MarshalGQL(w io.Writer) {
	fmt.Fprint(w, strconv.Quote(e.String()))
}
