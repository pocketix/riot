import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { v4 as uuid } from 'uuid'
import { produce } from 'immer'
import KPIDetailPageView from './KPIDetailPageView'
import { AtomNodeType, EditableTreeNodeDataModel, LogicalOperationNodeType, NodeType } from './components/editable-tree/EditableTree'
import { useParams } from 'react-router-dom'
import { ApolloError, QueryResult, useQuery } from '@apollo/client'
import { BooleanEqAtomKpiNode, FullKpiDefinitionsQuery, FullKpiDefinitionsQueryVariables, KpiDefinition, KpiNode, KpiNodeType, LogicalOperationKpiNode, LogicalOperationType, NumericEqAtomKpiNode, NumericGeqAtomKpiNode, NumericGtAtomKpiNode, NumericLeqAtomKpiNode, NumericLtAtomKpiNode, StringEqAtomKpiNode } from '../../generated/graphql'
import gql from 'graphql-tag'
import qFullKPIDefinitions from '../../graphql/queries/fullKPIDefinitions.graphql'

export interface KPIModel extends EditableTreeNodeDataModel {
  id: string
  userIdentifier: string
}

const logicalOperationTypeToLogicalOperationNodeType = (type: LogicalOperationType): LogicalOperationNodeType => {
  switch (type) {
    case LogicalOperationType.And:
      return LogicalOperationNodeType.AND
    case LogicalOperationType.Or:
      return LogicalOperationNodeType.OR
    case LogicalOperationType.Nor:
      return LogicalOperationNodeType.NOR
  }
}

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
          logicalOperationNodeType: logicalOperationTypeToLogicalOperationNodeType((kpiNode as LogicalOperationKpiNode).type)
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

const kpiDefinitionToKPIModel = (kpiDefinition: KpiDefinition): KPIModel => {
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

const KPIDetailPageController: React.FC = () => {
  const { id } = useParams()

  const fullKPIDefinitionsQueryResult: QueryResult<FullKpiDefinitionsQuery, FullKpiDefinitionsQueryVariables> = useQuery<FullKpiDefinitionsQuery, FullKpiDefinitionsQueryVariables>(gql(qFullKPIDefinitions))
  const fullKPIDefinitionsQueryData: FullKpiDefinitionsQuery = fullKPIDefinitionsQueryResult.data
  const fullKPIDefinitionsQueryLoading: boolean = fullKPIDefinitionsQueryResult.loading
  const fullKPIDefinitionsQueryError: ApolloError | undefined = fullKPIDefinitionsQueryResult.error

  const targetKPIDefinition: KpiDefinition = useMemo(() => {
    if (!id || !fullKPIDefinitionsQueryData) {
      return undefined
    }
    return fullKPIDefinitionsQueryData.kpiDefinitions.find((kpiDefinition) => kpiDefinition.id === id)
  }, [id, fullKPIDefinitionsQueryData])

  const [kpi, setKPI] = useState<KPIModel>({
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
  })

  useEffect(() => {
    if (targetKPIDefinition) {
      setKPI(kpiDefinitionToKPIModel(targetKPIDefinition))
    }
  }, [targetKPIDefinition])

  const [isChangeLogicalOperationTypeModalOpen, setIsChangeLogicalOperationTypeModalOpen] = useState<boolean>(false)

  const closeChangeLogicalOperationTypeModal = useCallback(() => {
    setIsChangeLogicalOperationTypeModalOpen(false)
  }, [setIsChangeLogicalOperationTypeModalOpen])

  const [currentNodeName, setCurrentNodeName] = useState<string>('')

  const changeLogicalOperationType = useCallback(
    (newOperationType: LogicalOperationNodeType): void => {
      setKPI(
        produce(kpi, (draftKPI) => {
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
          processNode(draftKPI)
        })
      )
    },
    [currentNodeName]
  )

  const initiateLogicalOperationNodeModification = useCallback(
    (nodeName: string) => {
      setCurrentNodeName(nodeName)
      setIsChangeLogicalOperationTypeModalOpen(true)
    },
    [setCurrentNodeName, setIsChangeLogicalOperationTypeModalOpen]
  )

  return (
    <KPIDetailPageView
      kpi={kpi}
      anyLoadingOccurs={fullKPIDefinitionsQueryLoading}
      anyErrorOccurred={!!fullKPIDefinitionsQueryError}
      isChangeLogicalOperationTypeModalOpen={isChangeLogicalOperationTypeModalOpen}
      closeChangeLogicalOperationTypeModal={closeChangeLogicalOperationTypeModal}
      changeLogicalOperationType={changeLogicalOperationType}
      initiateLogicalOperationNodeModification={initiateLogicalOperationNodeModification}
    />
  )
}

export default KPIDetailPageController
