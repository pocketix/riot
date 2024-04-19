import React, { useEffect, useMemo, useRef, useState } from 'react'
import { produce } from 'immer'
import KPIDetailPageView from './KPIDetailPageView'
import { AtomNodeType, EditableTreeNodeDataModel, LogicalOperationNodeType } from './components/editable-tree/EditableTree'
import { useParams } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { KpiDefinitionDetailQuery, KpiDefinitionDetailQueryVariables, SdType, SdTypesQuery, SdTypesQueryVariables } from '../../generated/graphql'
import gql from 'graphql-tag'
import qKPIDefinitionDetail from '../../graphql/queries/kpiDefinitionDetail.graphql'
import qSDTypes from '../../graphql/queries/sdTypes.graphql'
import { initialKPIDefinitionModel, changeLogicalOperationTypeOfLogicalOperationNode, crateNewLogicalOperationNode, kpiDefinitionToKPIDefinitionModel, crateNewAtomNode } from './kpiDefinitionModel'

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
  const {
    data: kpiDefinitionDetailData,
    loading: kpiDefinitionDetailLoading,
    error: kpiDefinitionDetailError
  } = useQuery<KpiDefinitionDetailQuery, KpiDefinitionDetailQueryVariables>(gql(qKPIDefinitionDetail), {
    skip: !id,
    variables: {
      id: id
    }
  })
  const { data: sdTypesData, loading: sdTypesLoading, error: sdTypesError } = useQuery<SdTypesQuery, SdTypesQueryVariables>(gql(qSDTypes))

  const [definitionModel, setDefinitionModel] = useState<KPIDefinitionModel>(initialKPIDefinitionModel)
  const [sdTypeData, setSDTypeData] = useState<SdType>(null)
  const [isSelectLogicalOperationTypeModalOpen, setIsSelectLogicalOperationTypeModalOpen] = useState<boolean>(false)
  const [isSelectNewNodeTypeModalOpen, setIsSelectNewNodeTypeModalOpen] = useState<boolean>(false)
  const [isAtomNodeModalOpen, setIsAtomNodeModalOpen] = useState<boolean>(false)
  const [logicalOperationSelectionMode, setLogicalOperationSelectionMode] = useState<LogicalOperationSelectionMode>(LogicalOperationSelectionMode.Idle)

  const currentNodeNameRef = useRef('')

  useEffect(() => kpiDefinitionDetailData && setDefinitionModel(kpiDefinitionToKPIDefinitionModel(kpiDefinitionDetailData.kpiDefinition)), [kpiDefinitionDetailData])
  useEffect(() => {
    sdTypesData && kpiDefinitionDetailData && setSDTypeData(sdTypesData.sdTypes.find((sdType) => sdType.denotation === kpiDefinitionDetailData.kpiDefinition.sdTypeSpecification))
  }, [sdTypesData, kpiDefinitionDetailData])

  const initiateLogicalOperationNodeModification = (nodeName: string) => {
    currentNodeNameRef.current = nodeName
    setLogicalOperationSelectionMode(LogicalOperationSelectionMode.NodeUpdate)
    setIsSelectLogicalOperationTypeModalOpen(true)
  }

  const changeLogicalOperationType = (newOperationType: LogicalOperationNodeType): void => {
    setDefinitionModel((definitionModel) =>
      produce(definitionModel, (draftDefinitionModel) => {
        changeLogicalOperationTypeOfLogicalOperationNode(currentNodeNameRef.current, draftDefinitionModel, newOperationType)
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

  const initiateNewAtomNodeCreation = () => {
    setIsSelectNewNodeTypeModalOpen(false)
    setIsAtomNodeModalOpen(true)
  }

  const finalizeNewLogicalOperationNodeCreation = (logicalOperationType: LogicalOperationNodeType) => {
    setDefinitionModel((definitionModel) =>
      produce(definitionModel, (draftDefinitionModel) => {
        crateNewLogicalOperationNode(currentNodeNameRef.current, draftDefinitionModel, logicalOperationType)
      })
    )
    setIsSelectLogicalOperationTypeModalOpen(false)
  }

  const finalizeNewAtomNodeCreation = (type: AtomNodeType, sdParameterSpecification: string, referenceValue: string | boolean | number) => {
    setDefinitionModel((definitionModel) =>
      produce(definitionModel, (draftDefinitionModel) => {
        crateNewAtomNode(currentNodeNameRef.current, draftDefinitionModel, type, sdParameterSpecification, referenceValue)
      })
    )
    setIsAtomNodeModalOpen(false)
  }

  const handleSDTypeSelection = (sdTypeID: string) => {
    if (!sdTypesData) {
      return
    }
    const selectedSDType = sdTypesData.sdTypes.find((sdType) => sdType.id === sdTypeID)
    if (!selectedSDType || (sdTypeData && selectedSDType.id === sdTypeData.id)) {
      return
    }
    setSDTypeData(selectedSDType)
    setDefinitionModel(initialKPIDefinitionModel)
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
      sdTypesData={sdTypesData}
      sdTypeData={sdTypeData}
      anyLoadingOccurs={kpiDefinitionDetailLoading || sdTypesLoading}
      anyErrorOccurred={!!kpiDefinitionDetailError || !!sdTypesError}
      isSelectLogicalOperationTypeModalOpen={isSelectLogicalOperationTypeModalOpen}
      isSelectNewNodeTypeModalOpen={isSelectNewNodeTypeModalOpen}
      isAtomNodeModalOpen={isAtomNodeModalOpen}
      closeSelectLogicalOperationTypeModal={() => setIsSelectLogicalOperationTypeModalOpen(false)}
      closeSelectNewNodeTypeModal={() => setIsSelectNewNodeTypeModalOpen(false)}
      closeAtomNodeModal={() => setIsAtomNodeModalOpen(false)}
      selectedLogicalOperationTypeHandler={selectedLogicalOperationTypeHandler}
      initiateLogicalOperationNodeModification={initiateLogicalOperationNodeModification}
      initiateNewNodeCreation={initiateNewNodeCreation}
      initiateNewLogicalOperationNodeCreation={initiateNewLogicalOperationNodeCreation}
      initiateNewAtomNodeCreation={initiateNewAtomNodeCreation}
      finalizeNewAtomNodeCreation={finalizeNewAtomNodeCreation}
      handleSDTypeSelection={handleSDTypeSelection}
    />
  )
}

export default KPIDetailPageController
