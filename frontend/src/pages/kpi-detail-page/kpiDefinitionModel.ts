import {
  BooleanEqAtomKpiNode,
  KpiDefinition,
  KpiDefinitionInput,
  KpiNode,
  KpiNodeInput,
  KpiNodeType,
  LogicalOperationKpiNode,
  LogicalOperationType,
  NumericEqAtomKpiNode,
  NumericGeqAtomKpiNode,
  NumericGtAtomKpiNode,
  NumericLeqAtomKpiNode,
  NumericLtAtomKpiNode,
  SdInstanceMode,
  StringEqAtomKpiNode
} from '../../generated/graphql'
import { AtomNodeType, EditableTreeNodeDataModel, LogicalOperationNodeType, NodeType } from './components/editable-tree/EditableTree'
import { KPIDefinitionModel } from './KPIDetailPageController'
import { ConsumerFunction, generateNewUUID, SequentialNumberGenerator } from '../../util'

const newNode = (): EditableTreeNodeDataModel => {
  return {
    name: generateNewUUID(),
    attributes: {
      nodeType: NodeType.NewNode
    },
    children: []
  }
}

const newAtomNode = (atomNodeType: AtomNodeType, sdParameterId: string, sdParameterSpecification: string, referenceValue: string | boolean | number): EditableTreeNodeDataModel => {
  const node = newNode()
  node.attributes.nodeType = NodeType.AtomNode
  node.attributes.atomNodeType = atomNodeType
  node.attributes.atomNodeSDParameterID = sdParameterId
  node.attributes.atomNodeSDParameterSpecification = sdParameterSpecification
  node.attributes.atomNodeReferenceValue = referenceValue
  return node
}

const newLogicalOperationNode = (logicalOperationNodeType: LogicalOperationNodeType): EditableTreeNodeDataModel => {
  const node = newNode()
  node.attributes.nodeType = NodeType.LogicalOperationNode
  node.attributes.logicalOperationNodeType = logicalOperationNodeType
  node.children = [newNode()]
  return node
}

const kpiNodeToEditableTreeNodeDataModel = (kpiNode: KpiNode): EditableTreeNodeDataModel => {
  switch (kpiNode.nodeType) {
    case KpiNodeType.StringEqAtom:
      const stringEQ = kpiNode as StringEqAtomKpiNode
      return newAtomNode(AtomNodeType.StringEQ, stringEQ.sdParameterID, stringEQ.sdParameterSpecification, stringEQ.stringReferenceValue)
    case KpiNodeType.BooleanEqAtom:
      const booleanEQ = kpiNode as BooleanEqAtomKpiNode
      return newAtomNode(AtomNodeType.BooleanEQ, booleanEQ.sdParameterID, booleanEQ.sdParameterSpecification, booleanEQ.booleanReferenceValue)
    case KpiNodeType.NumericEqAtom:
      const numericEQ = kpiNode as NumericEqAtomKpiNode
      return newAtomNode(AtomNodeType.NumericEQ, numericEQ.sdParameterID, numericEQ.sdParameterSpecification, numericEQ.numericReferenceValue)
    case KpiNodeType.NumericGtAtom:
      const numericGT = kpiNode as NumericGtAtomKpiNode
      return newAtomNode(AtomNodeType.NumericGT, numericGT.sdParameterID, numericGT.sdParameterSpecification, numericGT.numericReferenceValue)
    case KpiNodeType.NumericGeqAtom:
      const numericGEQ = kpiNode as NumericGeqAtomKpiNode
      return newAtomNode(AtomNodeType.NumericGEQ, numericGEQ.sdParameterID, numericGEQ.sdParameterSpecification, numericGEQ.numericReferenceValue)
    case KpiNodeType.NumericLtAtom:
      const numericLT = kpiNode as NumericLtAtomKpiNode
      return newAtomNode(AtomNodeType.NumericLT, numericLT.sdParameterID, numericLT.sdParameterSpecification, numericLT.numericReferenceValue)
    case KpiNodeType.NumericLeqAtom:
      const numericLEQ = kpiNode as NumericLeqAtomKpiNode
      return newAtomNode(AtomNodeType.NumericLEQ, numericLEQ.sdParameterID, numericLEQ.sdParameterSpecification, numericLEQ.numericReferenceValue)
    case KpiNodeType.LogicalOperation:
      const logicalOperationNodeType = ((logicalOperationType: LogicalOperationType): LogicalOperationNodeType => {
        switch (logicalOperationType) {
          case LogicalOperationType.And:
            return LogicalOperationNodeType.AND
          case LogicalOperationType.Or:
            return LogicalOperationNodeType.OR
          case LogicalOperationType.Nor:
            return LogicalOperationNodeType.NOR
        }
      })((kpiNode as LogicalOperationKpiNode).type)
      return newLogicalOperationNode(logicalOperationNodeType)
  }
}

export const kpiDefinitionToKPIDefinitionModel = (kpiDefinition: KpiDefinition): KPIDefinitionModel => {
  const nodeByIdMap: { [id: string]: EditableTreeNodeDataModel } = {}
  kpiDefinition.nodes.forEach((node) => {
    nodeByIdMap[node.id] = kpiNodeToEditableTreeNodeDataModel(node)
  })
  let rootNodeId: string | null = null
  kpiDefinition.nodes.forEach((node) => {
    if (node.parentNodeID) {
      nodeByIdMap[node.parentNodeID].children.unshift(nodeByIdMap[node.id])
    } else {
      rootNodeId = node.id
    }
  })
  return {
    id: kpiDefinition.id,
    userIdentifier: kpiDefinition.userIdentifier,
    sdInstanceMode: kpiDefinition.sdInstanceMode,
    selectedSDInstanceUIDs: kpiDefinition.selectedSDInstanceUIDs,
    ...nodeByIdMap[rootNodeId]
  }
}

const processTree = (currentNodeName: string, node: EditableTreeNodeDataModel, processNode: ConsumerFunction<EditableTreeNodeDataModel>, appendNewNode: boolean) => {
  const handleNode = (node: EditableTreeNodeDataModel): boolean => {
    if (appendNewNode && node.children.some((child) => child.name === currentNodeName)) {
      node.children.push(newNode())
    }
    if (node.name === currentNodeName) {
      processNode(node)
      return true
    }
    if (node.children && node.children.length > 0) {
      return node.children.some((child) => handleNode(child))
    }
    return false
  }
  if (!handleNode(node)) {
    console.warn(`Node ${currentNodeName} not found in the tree!`)
  }
}

export const changeTypeOfLogicalOperationNode = (currentNodeName: string, node: EditableTreeNodeDataModel, newLogicalOperationNodeType: LogicalOperationNodeType) => {
  const processNode = (node: EditableTreeNodeDataModel) => {
    node.attributes.logicalOperationNodeType = newLogicalOperationNodeType
  }
  processTree(currentNodeName, node, processNode, false)
}

export const crateNewLogicalOperationNode = (currentNodeName: string, node: EditableTreeNodeDataModel, logicalOperationNodeType: LogicalOperationNodeType) => {
  const processNode = (node: EditableTreeNodeDataModel) => {
    node.attributes.nodeType = NodeType.LogicalOperationNode
    node.attributes.logicalOperationNodeType = logicalOperationNodeType
    node.children = [newNode()]
  }
  processTree(currentNodeName, node, processNode, true)
}

export const modifyAtomNode = (
  currentNodeName: string,
  node: EditableTreeNodeDataModel,
  atomNodeType?: AtomNodeType,
  sdParameterID?: string,
  sdParameterSpecification?: string,
  referenceValue?: string | boolean | number
) => {
  const processNode = (node: EditableTreeNodeDataModel) => {
    node.attributes.atomNodeType = atomNodeType ?? node.attributes.atomNodeType
    node.attributes.atomNodeSDParameterID = sdParameterID ?? node.attributes.atomNodeSDParameterID
    node.attributes.atomNodeSDParameterSpecification = sdParameterSpecification ?? node.attributes.atomNodeSDParameterSpecification
    node.attributes.atomNodeReferenceValue = referenceValue ?? node.attributes.atomNodeReferenceValue
  }
  processTree(currentNodeName, node, processNode, false)
}

export const crateNewAtomNode = (
  currentNodeName: string,
  node: EditableTreeNodeDataModel,
  atomNodeType: AtomNodeType,
  sdParameterID: string,
  sdParameterSpecification: string,
  referenceValue: string | boolean | number
) => {
  const processNode = (node: EditableTreeNodeDataModel) => {
    node.attributes.nodeType = NodeType.AtomNode
    node.attributes.atomNodeType = atomNodeType
    node.attributes.atomNodeSDParameterID = sdParameterID
    node.attributes.atomNodeSDParameterSpecification = sdParameterSpecification
    node.attributes.atomNodeReferenceValue = referenceValue
  }
  processTree(currentNodeName, node, processNode, true)
}

const editableTreeNodeDataModelToKpiNodeInput = (
  editableTreeNodeDataModel: EditableTreeNodeDataModel,
  sequentialNumberGenerator: SequentialNumberGenerator,
  parentNodeId?: string
): KpiNodeInput | null => {
  const kpiNodeInputBase = {
    id: sequentialNumberGenerator.getNextNumber().toString(),
    parentNodeID: parentNodeId
  }
  const nodeType = editableTreeNodeDataModel.attributes.nodeType
  if (nodeType === NodeType.AtomNode) {
    const kpiAtomNodeInputBase = {
      ...kpiNodeInputBase,
      sdParameterID: editableTreeNodeDataModel.attributes.atomNodeSDParameterID,
      sdParameterSpecification: editableTreeNodeDataModel.attributes.atomNodeSDParameterSpecification
    }
    switch (editableTreeNodeDataModel.attributes.atomNodeType) {
      case AtomNodeType.StringEQ:
        return {
          ...kpiAtomNodeInputBase,
          type: KpiNodeType.StringEqAtom,
          stringReferenceValue: editableTreeNodeDataModel.attributes.atomNodeReferenceValue as string
        }
      case AtomNodeType.BooleanEQ:
        return {
          ...kpiAtomNodeInputBase,
          type: KpiNodeType.BooleanEqAtom,
          booleanReferenceValue: editableTreeNodeDataModel.attributes.atomNodeReferenceValue as boolean
        }
      case AtomNodeType.NumericEQ:
        return {
          ...kpiAtomNodeInputBase,
          type: KpiNodeType.NumericEqAtom,
          numericReferenceValue: editableTreeNodeDataModel.attributes.atomNodeReferenceValue as number
        }
      case AtomNodeType.NumericGT:
        return {
          ...kpiAtomNodeInputBase,
          type: KpiNodeType.NumericGtAtom,
          numericReferenceValue: editableTreeNodeDataModel.attributes.atomNodeReferenceValue as number
        }
      case AtomNodeType.NumericGEQ:
        return {
          ...kpiAtomNodeInputBase,
          type: KpiNodeType.NumericGeqAtom,
          numericReferenceValue: editableTreeNodeDataModel.attributes.atomNodeReferenceValue as number
        }
      case AtomNodeType.NumericLT:
        return {
          ...kpiAtomNodeInputBase,
          type: KpiNodeType.NumericLtAtom,
          numericReferenceValue: editableTreeNodeDataModel.attributes.atomNodeReferenceValue as number
        }
      case AtomNodeType.NumericLEQ:
        return {
          ...kpiAtomNodeInputBase,
          type: KpiNodeType.NumericLeqAtom,
          numericReferenceValue: editableTreeNodeDataModel.attributes.atomNodeReferenceValue as number
        }
    }
  } else if (nodeType === NodeType.LogicalOperationNode) {
    return {
      ...kpiNodeInputBase,
      type: KpiNodeType.LogicalOperation,
      logicalOperationType: ((logicalOperationNodeType: LogicalOperationNodeType): LogicalOperationType => {
        switch (logicalOperationNodeType) {
          case LogicalOperationNodeType.AND:
            return LogicalOperationType.And
          case LogicalOperationNodeType.OR:
            return LogicalOperationType.Or
          case LogicalOperationNodeType.NOR:
            return LogicalOperationType.Nor
        }
      })(editableTreeNodeDataModel.attributes.logicalOperationNodeType)
    }
  }
  return null
}

const editableTreeNodeDataModelToKpiNodeInputs = (editableTreeNodeDataModel: EditableTreeNodeDataModel): KpiNodeInput[] => {
  const sequentialNumberGenerator = new SequentialNumberGenerator(1)
  const processNode = (node: EditableTreeNodeDataModel, parentNodeId?: string) => {
    const kpiNodeInput = editableTreeNodeDataModelToKpiNodeInput(node, sequentialNumberGenerator, parentNodeId)
    if (kpiNodeInput) {
      kpiNodeInputs.push(kpiNodeInput)
      node.children.forEach((child) => processNode(child, kpiNodeInput.id))
    }
  }
  let kpiNodeInputs: KpiNodeInput[] = []
  processNode(editableTreeNodeDataModel)
  return kpiNodeInputs
}

export const kpiDefinitionModelToKPIDefinitionInput = (kpiDefinitionModel: KPIDefinitionModel, sdTypeID: string, sdTypeSpecification: string): KpiDefinitionInput => {
  return {
    sdTypeID: sdTypeID,
    sdTypeSpecification: sdTypeSpecification,
    userIdentifier: kpiDefinitionModel.userIdentifier,
    nodes: editableTreeNodeDataModelToKpiNodeInputs(kpiDefinitionModel),
    sdInstanceMode: kpiDefinitionModel.sdInstanceMode,
    selectedSDInstanceUIDs: kpiDefinitionModel.sdInstanceMode === SdInstanceMode.Selected ? kpiDefinitionModel.selectedSDInstanceUIDs : []
  }
}

export const initialKPIDefinitionModel: KPIDefinitionModel = {
  id: '---',
  userIdentifier: 'Feel free to change the user identifier of this KPI definition',
  sdInstanceMode: SdInstanceMode.All,
  selectedSDInstanceUIDs: [],
  ...newNode()
}
