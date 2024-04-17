import React, { useEffect, useMemo, useRef, useState } from 'react'
import { produce } from 'immer'
import KPIDetailPageView from './KPIDetailPageView'
import { EditableTreeNodeDataModel, LogicalOperationNodeType, NodeType } from './components/editable-tree/EditableTree'
import { useParams } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { KpiDefinitionDetailQuery, KpiDefinitionDetailQueryVariables } from '../../generated/graphql'
import gql from 'graphql-tag'
import qKPIDefinitionDetail from '../../graphql/queries/kpiDefinitionDetail.graphql'
import { kpiDefinitionToKPIDefinitionModel, initialKPIDefinitionModel } from './kpiDefinitionModel'
import { v4 as uuid } from 'uuid'

export interface KPIDefinitionModel extends EditableTreeNodeDataModel {
  id: string
  userIdentifier: string
}

enum LogicalOperationSelectionMode {
  Idle,
  NodeUpdate,
  NodeCreation
}

const KPIDetailPageController: React.FC = () => {
  const { id } = useParams()
  const { data, loading, error } = useQuery<KpiDefinitionDetailQuery, KpiDefinitionDetailQueryVariables>(gql(qKPIDefinitionDetail), {
    skip: !id,
    variables: {
      id: id
    }
  })

  const [definitionModel, setDefinitionModel] = useState<KPIDefinitionModel>(initialKPIDefinitionModel)
  const [isSelectLogicalOperationTypeModalOpen, setIsSelectLogicalOperationTypeModalOpen] = useState<boolean>(false)
  const [isSelectNewNodeTypeModalOpen, setIsSelectNewNodeTypeModalOpen] = useState<boolean>(false)
  const [logicalOperationSelectionMode, setLogicalOperationSelectionMode] = useState<LogicalOperationSelectionMode>(LogicalOperationSelectionMode.Idle)

  const currentNodeNameRef = useRef('')

  useEffect(() => {
    if (!data) {
      return
    }
    setDefinitionModel(kpiDefinitionToKPIDefinitionModel(data.kpiDefinition))
  }, [data])

  const closeSelectLogicalOperationTypeModal = () => {
    setIsSelectLogicalOperationTypeModalOpen(false)
  }

  const closeSelectNewNodeTypeModal = () => {
    setIsSelectNewNodeTypeModalOpen(false)
  }

  const initiateLogicalOperationNodeModification = (nodeName: string) => {
    currentNodeNameRef.current = nodeName
    setLogicalOperationSelectionMode(LogicalOperationSelectionMode.NodeUpdate)
    setIsSelectLogicalOperationTypeModalOpen(true)
  }

  const changeLogicalOperationType = (newOperationType: LogicalOperationNodeType): void => {
    setDefinitionModel((definitionModel) =>
      produce(definitionModel, (draftDefinitionModel) => {
        const processNode = (node: EditableTreeNodeDataModel): boolean => {
          if (node.name === currentNodeNameRef.current && node.attributes.nodeType === NodeType.LogicalOperationNode) {
            node.attributes.logicalOperationNodeType = newOperationType
            return true
          }
          if (node.children && node.children.length > 0) {
            return node.children.some((child) => processNode(child))
          }
          return false
        }
        if (!processNode(draftDefinitionModel)) {
          console.warn('Target node not found in the tree!')
        }
      })
    )
    setLogicalOperationSelectionMode(LogicalOperationSelectionMode.Idle)
  }

  const initiateNewNodeCreation = (nodeName: string) => {
    currentNodeNameRef.current = nodeName
    setIsSelectNewNodeTypeModalOpen(true)
  }

  const initiateNewLogicalOperationNodeCreation = () => {
    setIsSelectNewNodeTypeModalOpen(false)
    setLogicalOperationSelectionMode(LogicalOperationSelectionMode.NodeCreation)
    setIsSelectLogicalOperationTypeModalOpen(true)
  }

  const finalizeNewLogicalOperationNodeCreation = (logicalOperationType: LogicalOperationNodeType) => {
    setDefinitionModel((definitionModel) =>
      produce(definitionModel, (draftDefinitionModel) => {
        const processNode = (node: EditableTreeNodeDataModel): boolean => {
          if (node.name === currentNodeNameRef.current && node.attributes.nodeType === NodeType.NewNode) {
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
        if (!processNode(draftDefinitionModel)) {
          console.warn('Target node not found in the tree!')
        }
      })
    )
    setIsSelectLogicalOperationTypeModalOpen(false)
  }

  const selectedLogicalOperationTypeHandler = useMemo(() => {
    switch (logicalOperationSelectionMode) {
      case LogicalOperationSelectionMode.Idle:
        return () => {}
      case LogicalOperationSelectionMode.NodeUpdate:
        return changeLogicalOperationType
      case LogicalOperationSelectionMode.NodeCreation:
        return finalizeNewLogicalOperationNodeCreation
    }
  }, [logicalOperationSelectionMode])

  return (
    <KPIDetailPageView
      kpiDefinitionModel={definitionModel}
      anyLoadingOccurs={loading}
      anyErrorOccurred={!!error}
      isSelectLogicalOperationTypeModalOpen={isSelectLogicalOperationTypeModalOpen}
      isSelectNewNodeTypeModalOpen={isSelectNewNodeTypeModalOpen}
      closeSelectLogicalOperationTypeModal={closeSelectLogicalOperationTypeModal}
      closeSelectNewNodeTypeModal={closeSelectNewNodeTypeModal}
      selectedLogicalOperationTypeHandler={selectedLogicalOperationTypeHandler}
      initiateLogicalOperationNodeModification={initiateLogicalOperationNodeModification}
      initiateNewNodeCreation={initiateNewNodeCreation}
      initiateNewLogicalOperationNodeCreation={initiateNewLogicalOperationNodeCreation}
    />
  )
}

export default KPIDetailPageController
