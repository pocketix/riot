import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { produce } from 'immer'
import KPIDetailPageView from './KPIDetailPageView'
import { EditableTreeNodeDataModel, LogicalOperationNodeType, NodeType } from './components/editable-tree/EditableTree'
import { useParams } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { FullKpiDefinitionsQuery, FullKpiDefinitionsQueryVariables, KpiDefinition } from '../../generated/graphql'
import gql from 'graphql-tag'
import qFullKPIDefinitions from '../../graphql/queries/fullKPIDefinitions.graphql'
import { kpiDefinitionToKPIDefinitionModel, initialKPIDefinitionModel } from './kpiDefinitionModel'

export interface KPIDefinitionModel extends EditableTreeNodeDataModel {
  id: string
  userIdentifier: string
}

const KPIDetailPageController: React.FC = () => {
  const { id } = useParams()
  const { data, loading, error } = useQuery<FullKpiDefinitionsQuery, FullKpiDefinitionsQueryVariables>(gql(qFullKPIDefinitions))

  const targetKPIDefinition: KpiDefinition = useMemo(() => {
    if (!id || !data) {
      return undefined
    }
    return data.kpiDefinitions.find((kpiDefinition) => kpiDefinition.id === id)
  }, [id, data])

  const [definitionModel, setDefinitionModel] = useState<KPIDefinitionModel>(initialKPIDefinitionModel)

  useEffect(() => {
    if (targetKPIDefinition) {
      setDefinitionModel(kpiDefinitionToKPIDefinitionModel(targetKPIDefinition))
    }
  }, [targetKPIDefinition])

  const [isChangeLogicalOperationTypeModalOpen, setIsChangeLogicalOperationTypeModalOpen] = useState<boolean>(false)

  const closeChangeLogicalOperationTypeModal = useCallback(() => {
    setIsChangeLogicalOperationTypeModalOpen(false)
  }, [setIsChangeLogicalOperationTypeModalOpen])

  const [currentNodeName, setCurrentNodeName] = useState<string>('')

  const changeLogicalOperationType = useCallback(
    (newOperationType: LogicalOperationNodeType): void => {
      setDefinitionModel(
        produce(definitionModel, (draftDefinitionModel) => {
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
          processNode(draftDefinitionModel)
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
      kpiDefinitionModel={definitionModel}
      anyLoadingOccurs={loading}
      anyErrorOccurred={!!error}
      isChangeLogicalOperationTypeModalOpen={isChangeLogicalOperationTypeModalOpen}
      closeChangeLogicalOperationTypeModal={closeChangeLogicalOperationTypeModal}
      changeLogicalOperationType={changeLogicalOperationType}
      initiateLogicalOperationNodeModification={initiateLogicalOperationNodeModification}
    />
  )
}

export default KPIDetailPageController
