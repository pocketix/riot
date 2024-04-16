package api2dto

import (
	"errors"
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/api/graphql/model"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/kpi"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func kpiNodeInputToKPINode(kpiNodeInput model.KPINodeInput) util.Result[kpi.NodeDTO] {
	constructErrorMessage := func(errorMessageBody string) string {
		return fmt.Sprintf("couldn't map KPI node input to KPI node DTO: %s", errorMessageBody)
	}
	nodeType := kpiNodeInput.Type
	if nodeType == model.KPINodeTypeLogicalOperation {
		logicalOperationTypeOptional := util.NewOptionalFromPointer[model.LogicalOperationType](kpiNodeInput.LogicalOperationType)
		if logicalOperationTypeOptional.IsEmpty() {
			return util.NewFailureResult[kpi.NodeDTO](errors.New(constructErrorMessage("logical operation type is missing")))
		}
		return util.NewSuccessResult[kpi.NodeDTO](kpi.LogicalOperationNodeDTO{
			Type: func(logicalOperationNodeType model.LogicalOperationType) kpi.LogicalOperationNodeType {
				switch logicalOperationNodeType {
				case model.LogicalOperationTypeAnd:
					return kpi.AND
				case model.LogicalOperationTypeOr:
					return kpi.OR
				case model.LogicalOperationTypeNor:
					return kpi.NOR
				}
				panic("couldn't map logical operation type... this shouldn't happen")
			}(logicalOperationTypeOptional.GetPayload()),
			ChildNodes: make([]kpi.NodeDTO, 0),
		})
	} else {
		sdParameterSpecificationOptional := util.NewOptionalFromPointer[string](kpiNodeInput.SdParameterSpecification)
		if sdParameterSpecificationOptional.IsEmpty() {
			return util.NewFailureResult[kpi.NodeDTO](errors.New(constructErrorMessage("SD parameter specification is missing")))
		}
		sdParameterSpecification := sdParameterSpecificationOptional.GetPayload()
		if nodeType == model.KPINodeTypeStringEQAtom {
			referenceValueOptional := util.NewOptionalFromPointer[string](kpiNodeInput.StringReferenceValue)
			if referenceValueOptional.IsEmpty() {
				return util.NewFailureResult[kpi.NodeDTO](errors.New(constructErrorMessage("reference value (string) is missing")))
			}
			return util.NewSuccessResult[kpi.NodeDTO](kpi.EQAtomNodeDTO[string]{
				SDParameterSpecification: sdParameterSpecification,
				ReferenceValue:           referenceValueOptional.GetPayload(),
			})
		} else if nodeType == model.KPINodeTypeBooleanEQAtom {
			referenceValueOptional := util.NewOptionalFromPointer[bool](kpiNodeInput.BooleanReferenceValue)
			if referenceValueOptional.IsEmpty() {
				return util.NewFailureResult[kpi.NodeDTO](errors.New(constructErrorMessage("reference value (boolean) is missing")))
			}
			return util.NewSuccessResult[kpi.NodeDTO](kpi.EQAtomNodeDTO[bool]{
				SDParameterSpecification: util.NewOptionalFromPointer[string](kpiNodeInput.SdParameterSpecification).GetPayload(),
				ReferenceValue:           referenceValueOptional.GetPayload(),
			})
		} else {
			referenceValueOptional := util.NewOptionalFromPointer[float64](kpiNodeInput.NumericReferenceValue)
			if referenceValueOptional.IsEmpty() {
				return util.NewFailureResult[kpi.NodeDTO](errors.New(constructErrorMessage("reference value (float) is missing")))
			}
			referenceValue := referenceValueOptional.GetPayload()
			switch nodeType {
			case model.KPINodeTypeNumericEQAtom:
				return util.NewSuccessResult[kpi.NodeDTO](kpi.EQAtomNodeDTO[float64]{
					SDParameterSpecification: sdParameterSpecification,
					ReferenceValue:           referenceValue,
				})
			case model.KPINodeTypeNumericLTAtom:
				return util.NewSuccessResult[kpi.NodeDTO](kpi.NumericLTAtomNodeDTO{
					SDParameterSpecification: sdParameterSpecification,
					ReferenceValue:           referenceValue,
				})
			case model.KPINodeTypeNumericLEQAtom:
				return util.NewSuccessResult[kpi.NodeDTO](kpi.NumericLEQAtomNodeDTO{
					SDParameterSpecification: sdParameterSpecification,
					ReferenceValue:           referenceValue,
				})
			case model.KPINodeTypeNumericGTAtom:
				return util.NewSuccessResult[kpi.NodeDTO](kpi.NumericGTAtomNodeDTO{
					SDParameterSpecification: sdParameterSpecification,
					ReferenceValue:           referenceValue,
				})
			case model.KPINodeTypeNumericGEQAtom:
				return util.NewSuccessResult[kpi.NodeDTO](kpi.NumericGEQAtomNodeDTO{
					SDParameterSpecification: sdParameterSpecification,
					ReferenceValue:           referenceValue,
				})
			}
		}
	}
	panic("couldn't map KPI node input to KPI node DTO... this shouldn't happen")
}

func constructKPINodeByIDMap(kpiNodeInputs []model.KPINodeInput) util.Result[map[string]kpi.NodeDTO] {
	kpiNodeByIDMap := make(map[string]kpi.NodeDTO)
	for _, kpiNodeInput := range kpiNodeInputs {
		kpiNodeResult := kpiNodeInputToKPINode(kpiNodeInput)
		if kpiNodeResult.IsFailure() {
			return util.NewFailureResult[map[string]kpi.NodeDTO](kpiNodeResult.GetError())
		}
		kpiNodeByIDMap[kpiNodeInput.ID] = kpiNodeResult.GetPayload()
	}
	return util.NewSuccessResult[map[string]kpi.NodeDTO](kpiNodeByIDMap)
}

func KPIDefinitionInputToKPIDefinitionDTO(kpiDefinitionInput model.KPIDefinitionInput) util.Result[kpi.DefinitionDTO] {
	kpiNodeInputs := util.Map[*model.KPINodeInput, model.KPINodeInput](kpiDefinitionInput.Nodes, func(p *model.KPINodeInput) model.KPINodeInput { return *p })
	kpiNodeByIDMapConstructionResult := constructKPINodeByIDMap(kpiNodeInputs)
	if kpiNodeByIDMapConstructionResult.IsFailure() {
		return util.NewFailureResult[kpi.DefinitionDTO](kpiNodeByIDMapConstructionResult.GetError())
	}
	kpiNodeByIDMap := kpiNodeByIDMapConstructionResult.GetPayload()
	var rootNodeID string
	for _, kpiNodeInput := range kpiNodeInputs {
		parentNodeID := kpiNodeInput.ParentNodeID
		if parentNodeID == nil {
			rootNodeID = kpiNodeInput.ID
		} else {
			parentNode := kpiNodeByIDMap[*parentNodeID]
			if !util.TypeIs[kpi.LogicalOperationNodeDTO](parentNode) {
				return util.NewFailureResult[kpi.DefinitionDTO](errors.New("parent node is not logical operation node"))
			}
			logicalOperationNode := parentNode.(kpi.LogicalOperationNodeDTO)
			logicalOperationNode.ChildNodes = append(logicalOperationNode.ChildNodes, kpiNodeByIDMap[kpiNodeInput.ID])
			kpiNodeByIDMap[*parentNodeID] = logicalOperationNode
		}
	}
	return util.NewSuccessResult[kpi.DefinitionDTO](kpi.DefinitionDTO{
		ID:                  util.NewEmptyOptional[uint32](),
		SDTypeSpecification: kpiDefinitionInput.SdTypeSpecification,
		UserIdentifier:      kpiDefinitionInput.UserIdentifier,
		RootNode:            kpiNodeByIDMap[rootNodeID],
	})
}
