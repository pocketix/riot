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

const kpiNodeToEditableTreeNodeDataModel = (kpiNode: KpiNode): EditableTreeNodeDataModel => {
  switch (kpiNode.nodeType) {
    case KpiNodeType.StringEqAtom:
      return {
        name: uuid(),
        attributes: {
          nodeType: NodeType.AtomNode,
          atomNodeType: AtomNodeType.StringEQ,
          atomNodeSDParameterSpecification: (kpiNode as StringEqAtomKpiNode).sdParameterSpecification,
          atomNodeReferenceValue: (kpiNode as StringEqAtomKpiNode).stringReferenceValue
        },
        children: []
      }
    case KpiNodeType.BooleanEqAtom:
      return {
        name: uuid(),
        attributes: {
          nodeType: NodeType.AtomNode,
          atomNodeType: AtomNodeType.BooleanEQ,
          atomNodeSDParameterSpecification: (kpiNode as BooleanEqAtomKpiNode).sdParameterSpecification,
          atomNodeReferenceValue: (kpiNode as BooleanEqAtomKpiNode).booleanReferenceValue
        },
        children: []
      }
    case KpiNodeType.NumericEqAtom:
      return {
        name: uuid(),
        attributes: {
          nodeType: NodeType.AtomNode,
          atomNodeType: AtomNodeType.NumericEQ,
          atomNodeSDParameterSpecification: (kpiNode as NumericEqAtomKpiNode).sdParameterSpecification,
          atomNodeReferenceValue: (kpiNode as NumericEqAtomKpiNode).numericReferenceValue
        },
        children: []
      }
    case KpiNodeType.NumericGtAtom:
      return {
        name: uuid(),
        attributes: {
          nodeType: NodeType.AtomNode,
          atomNodeType: AtomNodeType.NumericGT,
          atomNodeSDParameterSpecification: (kpiNode as NumericGtAtomKpiNode).sdParameterSpecification,
          atomNodeReferenceValue: (kpiNode as NumericGtAtomKpiNode).numericReferenceValue
        },
        children: []
      }
    case KpiNodeType.NumericGeqAtom:
      return {
        name: uuid(),
        attributes: {
          nodeType: NodeType.AtomNode,
          atomNodeType: AtomNodeType.NumericGEQ,
          atomNodeSDParameterSpecification: (kpiNode as NumericGeqAtomKpiNode).sdParameterSpecification,
          atomNodeReferenceValue: (kpiNode as NumericGeqAtomKpiNode).numericReferenceValue
        },
        children: []
      }
    case KpiNodeType.NumericLtAtom:
      return {
        name: uuid(),
        attributes: {
          nodeType: NodeType.AtomNode,
          atomNodeType: AtomNodeType.NumericLT,
          atomNodeSDParameterSpecification: (kpiNode as NumericLtAtomKpiNode).sdParameterSpecification,
          atomNodeReferenceValue: (kpiNode as NumericLtAtomKpiNode).numericReferenceValue
        },
        children: []
      }
    case KpiNodeType.NumericLeqAtom:
      return {
        name: uuid(),
        attributes: {
          nodeType: NodeType.AtomNode,
          atomNodeType: AtomNodeType.NumericLEQ,
          atomNodeSDParameterSpecification: (kpiNode as NumericLeqAtomKpiNode).sdParameterSpecification,
          atomNodeReferenceValue: (kpiNode as NumericLeqAtomKpiNode).numericReferenceValue
        },
        children: []
      }
    case KpiNodeType.LogicalOperation:
      return {
        name: uuid(),
        attributes: {
          nodeType: NodeType.LogicalOperationNode,
          logicalOperationNodeType: ((type: LogicalOperationType): LogicalOperationNodeType => {
            switch (type) {
              case LogicalOperationType.And:
                return LogicalOperationNodeType.AND
              case LogicalOperationType.Or:
                return LogicalOperationNodeType.OR
              case LogicalOperationType.Nor:
                return LogicalOperationNodeType.NOR
            }
          })((kpiNode as LogicalOperationKpiNode).type)
        },
        children: [
          {
            name: uuid(),
            attributes: {
              nodeType: NodeType.NewNode
            },
            children: []
          }
        ]
      }
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

export const changeLogicalOperationTypeOfLogicalOperationNode = (currentNodeName: string, node: EditableTreeNodeDataModel, newOperationType: LogicalOperationNodeType) => {
  const processNode = (node: EditableTreeNodeDataModel): boolean => {
    if (node.name === currentNodeName && node.attributes.nodeType === NodeType.LogicalOperationNode) {
      node.attributes.logicalOperationNodeType = newOperationType
      return true
    }
    if (node.children && node.children.length > 0) {
      return node.children.some((child) => processNode(child))
    }
    return false
  }
  if (!processNode(node)) {
    console.warn('Target node not found in the tree!')
  }
}

export const crateNewLogicalOperationNode = (currentNodeName: string, node: EditableTreeNodeDataModel, logicalOperationType: LogicalOperationNodeType) => {
  const processNode = (node: EditableTreeNodeDataModel): boolean => {
    if (node.children.some((child) => child.name === currentNodeName)) {
      node.children.push({
        name: uuid(),
        attributes: {
          nodeType: NodeType.NewNode
        },
        children: []
      })
    }
    if (node.name === currentNodeName && node.attributes.nodeType === NodeType.NewNode) {
      node.attributes.nodeType = NodeType.LogicalOperationNode
      node.attributes.logicalOperationNodeType = logicalOperationType
      node.children = [
        {
          name: uuid(),
          attributes: {
            nodeType: NodeType.NewNode
          },
          children: []
        }
      ]
      return true
    }
    if (node.children && node.children.length > 0) {
      return node.children.some((child) => processNode(child))
    }
    return false
  }
  if (!processNode(node)) {
    console.warn('Target node not found in the tree!')
  }
}

export const crateNewAtomNode = (currentNodeName: string, node: EditableTreeNodeDataModel, type: AtomNodeType, sdParameterSpecification: string, referenceValue: string | boolean | number) => {
  const processNode = (node: EditableTreeNodeDataModel): boolean => {
    if (node.children.some((child) => child.name === currentNodeName)) {
      node.children.push({
        name: uuid(),
        attributes: {
          nodeType: NodeType.NewNode
        },
        children: []
      })
    }
    if (node.name === currentNodeName && node.attributes.nodeType === NodeType.NewNode) {
      node.attributes.nodeType = NodeType.AtomNode
      node.attributes.atomNodeType = type
      node.attributes.atomNodeSDParameterSpecification = sdParameterSpecification
      node.attributes.atomNodeReferenceValue = referenceValue
      return true
    }
    if (node.children && node.children.length > 0) {
      return node.children.some((child) => processNode(child))
    }
    return false
  }
  if (!processNode(node)) {
    console.warn('Target node not found in the tree!')
  }
}

export const initialKPIDefinitionModel: KPIDefinitionModel = {
  id: '---',
  userIdentifier: 'Feel free to change the user identifier of this KPI definition',
  name: uuid(),
  attributes: {
    nodeType: NodeType.LogicalOperationNode,
    logicalOperationNodeType: LogicalOperationNodeType.AND
  },
  children: [
    {
      name: uuid(),
      attributes: {
        nodeType: NodeType.NewNode
      },
      children: []
    }
  ]
}
