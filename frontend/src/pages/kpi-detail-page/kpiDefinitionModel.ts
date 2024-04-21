import {
  BooleanEqAtomKpiNode,
  KpiDefinition,
  KpiNode,
  KpiNodeType,
  LogicalOperationKpiNode,
  LogicalOperationType,
  NumericEqAtomKpiNode,
  NumericGeqAtomKpiNode,
  NumericGtAtomKpiNode,
  NumericLeqAtomKpiNode,
  NumericLtAtomKpiNode,
  StringEqAtomKpiNode
} from '../../generated/graphql'
import { AtomNodeType, EditableTreeNodeDataModel, LogicalOperationNodeType, NodeType } from './components/editable-tree/EditableTree'
import { v4 as uuid } from 'uuid'
import { KPIDefinitionModel } from './KPIDetailPageController'
import { ConsumerFunction } from '../../util'

const newNode = (): EditableTreeNodeDataModel => {
  return {
    name: uuid(),
    attributes: {
      nodeType: NodeType.NewNode
    },
    children: []
  }
}

const newAtomNode = (atomNodeType: AtomNodeType, sdParameterSpecification: string, referenceValue: string | boolean | number): EditableTreeNodeDataModel => {
  const node = newNode()
  node.attributes.nodeType = NodeType.AtomNode
  node.attributes.atomNodeType = atomNodeType
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
      return newAtomNode(AtomNodeType.StringEQ, stringEQ.sdParameterSpecification, stringEQ.stringReferenceValue)
    case KpiNodeType.BooleanEqAtom:
      const booleanEQ = kpiNode as BooleanEqAtomKpiNode
      return newAtomNode(AtomNodeType.BooleanEQ, booleanEQ.sdParameterSpecification, booleanEQ.booleanReferenceValue)
    case KpiNodeType.NumericEqAtom:
      const numericEQ = kpiNode as NumericEqAtomKpiNode
      return newAtomNode(AtomNodeType.NumericEQ, numericEQ.sdParameterSpecification, numericEQ.numericReferenceValue)
    case KpiNodeType.NumericGtAtom:
      const numericGT = kpiNode as NumericGtAtomKpiNode
      return newAtomNode(AtomNodeType.NumericGT, numericGT.sdParameterSpecification, numericGT.numericReferenceValue)
    case KpiNodeType.NumericGeqAtom:
      const numericGEQ = kpiNode as NumericGeqAtomKpiNode
      return newAtomNode(AtomNodeType.NumericGEQ, numericGEQ.sdParameterSpecification, numericGEQ.numericReferenceValue)
    case KpiNodeType.NumericLtAtom:
      const numericLT = kpiNode as NumericLtAtomKpiNode
      return newAtomNode(AtomNodeType.NumericLT, numericLT.sdParameterSpecification, numericLT.numericReferenceValue)
    case KpiNodeType.NumericLeqAtom:
      const numericLEQ = kpiNode as NumericLeqAtomKpiNode
      return newAtomNode(AtomNodeType.NumericLEQ, numericLEQ.sdParameterSpecification, numericLEQ.numericReferenceValue)
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
  sdParameterSpecification?: string,
  referenceValue?: string | boolean | number
) => {
  const processNode = (node: EditableTreeNodeDataModel) => {
    node.attributes.atomNodeType = atomNodeType ?? node.attributes.atomNodeType
    node.attributes.atomNodeSDParameterSpecification = sdParameterSpecification ?? node.attributes.atomNodeSDParameterSpecification
    node.attributes.atomNodeReferenceValue = referenceValue ?? node.attributes.atomNodeReferenceValue
  }
  processTree(currentNodeName, node, processNode, false)
}

export const crateNewAtomNode = (currentNodeName: string, node: EditableTreeNodeDataModel, atomNodeType: AtomNodeType, sdParameterSpecification: string, referenceValue: string | boolean | number) => {
  const processNode = (node: EditableTreeNodeDataModel) => {
    node.attributes.nodeType = NodeType.AtomNode
    node.attributes.atomNodeType = atomNodeType
    node.attributes.atomNodeSDParameterSpecification = sdParameterSpecification
    node.attributes.atomNodeReferenceValue = referenceValue
  }
  processTree(currentNodeName, node, processNode, true)
}

export const initialKPIDefinitionModel: KPIDefinitionModel = {
  id: '---',
  userIdentifier: 'Feel free to change the user identifier of this KPI definition',
  ...newLogicalOperationNode(LogicalOperationNodeType.AND)
}
