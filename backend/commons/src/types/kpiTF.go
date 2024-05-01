package types

// The primary goal of these models (...TF, which means Transport Format) is to allow the KPI definitions to be transported from
// the 'backend core' service to the instances of the 'message processing unit' services using RabbitMQ.
// This can be accomplished by creating models that are easily serialized to JSON.
// One would prefer to use already existing models, but using the (GraphQL) API models of 'backend core' in the source code of 'message processing unit'
// would create a source-code dependency between the services, which is undesirable...
// TODO: Try to reduce the complexity of the KPI definition models and the inter-model transformation code
// TODO: Consider replacing the ...TF models below by something else in the future...
// TODO: Optimally, there should be no more than three different models for KPI definitions: 1. API layer model (api), 2. application logic model (dto) and 3. data layer model (db)

import (
	"errors"
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/kpi"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
	"github.com/google/uuid"
)

type KPIDefinitionTF struct {
	ID    uint32      `json:"id"`
	Nodes []KPINodeTF `json:"nodes"`
}

type KPINodeTFType string

const (
	StringEQAtom     KPINodeTFType = "string-eq-atom"
	BooleanEQAtom    KPINodeTFType = "boolean-eq-atom"
	NumericEQAtom    KPINodeTFType = "numeric-eq-atom"
	NumericGTAtom    KPINodeTFType = "numeric-gt-atom"
	NumericGEQAtom   KPINodeTFType = "numeric-geq-atom"
	NumericLTAtom    KPINodeTFType = "numeric-lt-atom"
	NumericLEQAtom   KPINodeTFType = "numeric-leq-atom"
	LogicalOperation KPINodeTFType = "logical-operation"
)

type KPILogicalOperationNodeTFType string

const (
	AND KPILogicalOperationNodeTFType = "and"
	OR  KPILogicalOperationNodeTFType = "or"
	NOR KPILogicalOperationNodeTFType = "nor"
)

type KPINodeTF struct {
	ID                       string                         `json:"id"`
	ParentNodeID             *string                        `json:"parentNodeId"`
	NodeType                 KPINodeTFType                  `json:"nodeType"`
	SDParameterSpecification *string                        `json:"sdParameterSpecification"`
	StringReferenceValue     *string                        `json:"stringReferenceValue"`
	BooleanReferenceValue    *bool                          `json:"booleanReferenceValue"`
	NumericReferenceValue    *float64                       `json:"numericReferenceValue"`
	LogicalOperationType     *KPILogicalOperationNodeTFType `json:"logicalOperationType"`
}

func kpiNodeDTOToKPINode(kpiNodeDTO kpi.NodeDTO, id string, parentNodeID *string) KPINodeTF {
	switch typedKPINodeDTO := kpiNodeDTO.(type) {
	case kpi.EQAtomNodeDTO[string]:
		return KPINodeTF{
			ID:                       id,
			ParentNodeID:             parentNodeID,
			NodeType:                 StringEQAtom,
			SDParameterSpecification: &typedKPINodeDTO.SDParameterSpecification,
			StringReferenceValue:     &typedKPINodeDTO.ReferenceValue,
		}
	case kpi.EQAtomNodeDTO[bool]:
		return KPINodeTF{
			ID:                       id,
			ParentNodeID:             parentNodeID,
			NodeType:                 BooleanEQAtom,
			SDParameterSpecification: &typedKPINodeDTO.SDParameterSpecification,
			BooleanReferenceValue:    &typedKPINodeDTO.ReferenceValue,
		}
	case kpi.EQAtomNodeDTO[float64]:
		return KPINodeTF{
			ID:                       id,
			ParentNodeID:             parentNodeID,
			NodeType:                 NumericEQAtom,
			SDParameterSpecification: &typedKPINodeDTO.SDParameterSpecification,
			NumericReferenceValue:    &typedKPINodeDTO.ReferenceValue,
		}
	case kpi.NumericGTAtomNodeDTO:
		return KPINodeTF{
			ID:                       id,
			ParentNodeID:             parentNodeID,
			NodeType:                 NumericGTAtom,
			SDParameterSpecification: &typedKPINodeDTO.SDParameterSpecification,
			NumericReferenceValue:    &typedKPINodeDTO.ReferenceValue,
		}
	case kpi.NumericGEQAtomNodeDTO:
		return KPINodeTF{
			ID:                       id,
			ParentNodeID:             parentNodeID,
			NodeType:                 NumericGEQAtom,
			SDParameterSpecification: &typedKPINodeDTO.SDParameterSpecification,
			NumericReferenceValue:    &typedKPINodeDTO.ReferenceValue,
		}
	case kpi.NumericLTAtomNodeDTO:
		return KPINodeTF{
			ID:                       id,
			ParentNodeID:             parentNodeID,
			NodeType:                 NumericLTAtom,
			SDParameterSpecification: &typedKPINodeDTO.SDParameterSpecification,
			NumericReferenceValue:    &typedKPINodeDTO.ReferenceValue,
		}
	case kpi.NumericLEQAtomNodeDTO:
		return KPINodeTF{
			ID:                       id,
			ParentNodeID:             parentNodeID,
			NodeType:                 NumericLEQAtom,
			SDParameterSpecification: &typedKPINodeDTO.SDParameterSpecification,
			NumericReferenceValue:    &typedKPINodeDTO.ReferenceValue,
		}
	case kpi.LogicalOperationNodeDTO:
		return KPINodeTF{
			ID:           id,
			ParentNodeID: parentNodeID,
			NodeType:     LogicalOperation,
			LogicalOperationType: func(logicalOperationType kpi.LogicalOperationNodeType) *KPILogicalOperationNodeTFType {
				var kpiLogicalOperationNodeTFType KPILogicalOperationNodeTFType
				switch logicalOperationType {
				case kpi.AND:
					kpiLogicalOperationNodeTFType = AND
				case kpi.OR:
					kpiLogicalOperationNodeTFType = OR
				case kpi.NOR:
					kpiLogicalOperationNodeTFType = NOR
				}
				return &kpiLogicalOperationNodeTFType
			}(typedKPINodeDTO.Type),
		}
	}
	panic("couldn't map kpi.NodeDTO to KPINodeTF... shouldn't happen")
}

func processKPINodeDTO(node kpi.NodeDTO, parentID *string) []KPINodeTF {
	nodeID := uuid.New().String()
	nodes := make([]KPINodeTF, 0)
	nodes = append(nodes, kpiNodeDTOToKPINode(node, nodeID, parentID))
	if util.TypeIs[kpi.LogicalOperationNodeDTO](node) {
		for _, childNode := range node.(kpi.LogicalOperationNodeDTO).ChildNodes {
			nodes = append(nodes, processKPINodeDTO(childNode, &nodeID)...)
		}
	}
	return nodes
}

func KPIDefinitionDTOToKPIDefinitionTF(kpiDefinitionDTO kpi.DefinitionDTO) KPIDefinitionTF {
	return KPIDefinitionTF{
		ID:    kpiDefinitionDTO.ID.GetPayload(),
		Nodes: processKPINodeDTO(kpiDefinitionDTO.RootNode, nil),
	}
}

func kpiNodeTFToKPINodeDTO(kpiNodeTF KPINodeTF) util.Result[kpi.NodeDTO] {
	constructErrorMessage := func(errorMessageBody string) string {
		return fmt.Sprintf("couldn't map KPI node TF to KPI node DTO: %s", errorMessageBody)
	}
	nodeType := kpiNodeTF.NodeType
	if nodeType == LogicalOperation {
		logicalOperationTypeOptional := util.NewOptionalFromPointer[KPILogicalOperationNodeTFType](kpiNodeTF.LogicalOperationType)
		if logicalOperationTypeOptional.IsEmpty() {
			return util.NewFailureResult[kpi.NodeDTO](errors.New(constructErrorMessage("logical operation type is missing")))
		}
		return util.NewSuccessResult[kpi.NodeDTO](kpi.LogicalOperationNodeDTO{
			Type: func(kpiLogicalOperationNodeTFType KPILogicalOperationNodeTFType) kpi.LogicalOperationNodeType {
				switch kpiLogicalOperationNodeTFType {
				case AND:
					return kpi.AND
				case OR:
					return kpi.OR
				case NOR:
					return kpi.NOR
				}
				panic("couldn't map logical operation type... this shouldn't happen")
			}(logicalOperationTypeOptional.GetPayload()),
			ChildNodes: make([]kpi.NodeDTO, 0),
		})
	} else {
		sdParameterSpecificationOptional := util.NewOptionalFromPointer[string](kpiNodeTF.SDParameterSpecification)
		if sdParameterSpecificationOptional.IsEmpty() {
			return util.NewFailureResult[kpi.NodeDTO](errors.New(constructErrorMessage("SD parameter specification is missing")))
		}
		sdParameterSpecification := sdParameterSpecificationOptional.GetPayload()
		if nodeType == StringEQAtom {
			referenceValueOptional := util.NewOptionalFromPointer[string](kpiNodeTF.StringReferenceValue)
			if referenceValueOptional.IsEmpty() {
				return util.NewFailureResult[kpi.NodeDTO](errors.New(constructErrorMessage("reference value (string) is missing")))
			}
			return util.NewSuccessResult[kpi.NodeDTO](kpi.EQAtomNodeDTO[string]{
				SDParameterSpecification: sdParameterSpecification,
				ReferenceValue:           referenceValueOptional.GetPayload(),
			})
		} else if nodeType == BooleanEQAtom {
			referenceValueOptional := util.NewOptionalFromPointer[bool](kpiNodeTF.BooleanReferenceValue)
			if referenceValueOptional.IsEmpty() {
				return util.NewFailureResult[kpi.NodeDTO](errors.New(constructErrorMessage("reference value (boolean) is missing")))
			}
			return util.NewSuccessResult[kpi.NodeDTO](kpi.EQAtomNodeDTO[bool]{
				SDParameterSpecification: sdParameterSpecification,
				ReferenceValue:           referenceValueOptional.GetPayload(),
			})
		} else {
			referenceValueOptional := util.NewOptionalFromPointer[float64](kpiNodeTF.NumericReferenceValue)
			if referenceValueOptional.IsEmpty() {
				return util.NewFailureResult[kpi.NodeDTO](errors.New(constructErrorMessage("reference value (float) is missing")))
			}
			referenceValue := referenceValueOptional.GetPayload()
			switch nodeType {
			case NumericEQAtom:
				return util.NewSuccessResult[kpi.NodeDTO](kpi.EQAtomNodeDTO[float64]{
					SDParameterSpecification: sdParameterSpecification,
					ReferenceValue:           referenceValue,
				})
			case NumericLTAtom:
				return util.NewSuccessResult[kpi.NodeDTO](kpi.NumericLTAtomNodeDTO{
					SDParameterSpecification: sdParameterSpecification,
					ReferenceValue:           referenceValue,
				})
			case NumericLEQAtom:
				return util.NewSuccessResult[kpi.NodeDTO](kpi.NumericLEQAtomNodeDTO{
					SDParameterSpecification: sdParameterSpecification,
					ReferenceValue:           referenceValue,
				})
			case NumericGTAtom:
				return util.NewSuccessResult[kpi.NodeDTO](kpi.NumericGTAtomNodeDTO{
					SDParameterSpecification: sdParameterSpecification,
					ReferenceValue:           referenceValue,
				})
			case NumericGEQAtom:
				return util.NewSuccessResult[kpi.NodeDTO](kpi.NumericGEQAtomNodeDTO{
					SDParameterSpecification: sdParameterSpecification,
					ReferenceValue:           referenceValue,
				})
			}
		}
	}
	panic("couldn't map KPI node input to KPI node DTO... this shouldn't happen")
}

func constructKPINodeByIDMap(kpiNodesTF []KPINodeTF) util.Result[map[string]kpi.NodeDTO] {
	kpiNodeByIDMap := make(map[string]kpi.NodeDTO)
	for _, kpiNodeTF := range kpiNodesTF {
		kpiNodeResult := kpiNodeTFToKPINodeDTO(kpiNodeTF)
		if kpiNodeResult.IsFailure() {
			return util.NewFailureResult[map[string]kpi.NodeDTO](kpiNodeResult.GetError())
		}
		kpiNodeByIDMap[kpiNodeTF.ID] = kpiNodeResult.GetPayload()
	}
	return util.NewSuccessResult[map[string]kpi.NodeDTO](kpiNodeByIDMap)
}

func KPIDefinitionTFToKPIDefinitionDTO(kpiDefinitionTF KPIDefinitionTF) util.Result[kpi.DefinitionDTO] {
	kpiNodesTF := kpiDefinitionTF.Nodes
	kpiNodeByIDMapConstructionResult := constructKPINodeByIDMap(kpiNodesTF)
	if kpiNodeByIDMapConstructionResult.IsFailure() {
		return util.NewFailureResult[kpi.DefinitionDTO](kpiNodeByIDMapConstructionResult.GetError())
	}
	kpiNodeByIDMap := kpiNodeByIDMapConstructionResult.GetPayload()
	var rootNodeID string
	for _, kpiNodeTF := range kpiNodesTF {
		parentNodeID := kpiNodeTF.ParentNodeID
		if parentNodeID == nil {
			rootNodeID = kpiNodeTF.ID
		} else {
			parentNode := kpiNodeByIDMap[*parentNodeID]
			if !util.TypeIs[kpi.LogicalOperationNodeDTO](parentNode) {
				return util.NewFailureResult[kpi.DefinitionDTO](errors.New("parent node is not logical operation node"))
			}
			logicalOperationNode := parentNode.(kpi.LogicalOperationNodeDTO)
			logicalOperationNode.ChildNodes = append(logicalOperationNode.ChildNodes, kpiNodeByIDMap[kpiNodeTF.ID])
			kpiNodeByIDMap[*parentNodeID] = logicalOperationNode
		}
	}
	return util.NewSuccessResult(kpi.DefinitionDTO{
		ID:       util.NewOptionalOf(kpiDefinitionTF.ID),
		RootNode: kpiNodeByIDMap[rootNodeID],
	})
}
