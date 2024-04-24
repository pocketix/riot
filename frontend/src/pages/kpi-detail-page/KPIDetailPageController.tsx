import React, { useEffect, useMemo, useRef, useState } from 'react'
import { produce } from 'immer'
import KPIDetailPageView from './KPIDetailPageView'
import { AtomNodeType, EditableTreeNodeDataModel, LogicalOperationNodeType } from './components/editable-tree/EditableTree'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@apollo/client'
import {
  CreateKpiDefinitionMutation,
  CreateKpiDefinitionMutationVariables,
  KpiDefinitionDetailQuery,
  KpiDefinitionDetailQueryVariables,
  SdType,
  SdTypesQuery,
  SdTypesQueryVariables
} from '../../generated/graphql'
import gql from 'graphql-tag'
import qKPIDefinitionDetail from '../../graphql/queries/kpiDefinitionDetail.graphql'
import qSDTypes from '../../graphql/queries/sdTypes.graphql'
import {
  initialKPIDefinitionModel,
  changeTypeOfLogicalOperationNode,
  crateNewLogicalOperationNode,
  kpiDefinitionToKPIDefinitionModel,
  crateNewAtomNode,
  modifyAtomNode,
  kpiDefinitionModelToKPIDefinitionInput
} from './kpiDefinitionModel'
import mCreateKPIDefinition from '../../graphql/mutations/createKPIDefinition.graphql'
import { useModal } from '@ebay/nice-modal-react'
import SelectNewNodeTypeModal from './components/select-new-node-type-modal/SelectNewNodeTypeModal'
import SelectLogicalOperationTypeModal from './components/select-logical-operation-type-modal/SelectLogicalOperationTypeModal'
import AtomNodeModal from './components/atom-node-modal/AtomNodeModal'

export interface KPIDefinitionModel extends EditableTreeNodeDataModel {
  id: string
  userIdentifier: string
}

const KPIDetailPageController: React.FC = () => {
  const { show: showSelectNewNodeTypeModal, hide: hideSelectNewNodeTypeModal } = useModal(SelectNewNodeTypeModal)
  const { show: showSelectLogicalOperationTypeModal, hide: hideSelectLogicalOperationTypeModal } = useModal(SelectLogicalOperationTypeModal)
  const { show: showAtomNodeModal, hide: hideAtomNodeModal } = useModal(AtomNodeModal)

  const navigate = useNavigate()
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
  const [createKPIDefinitionMutation, { loading: createKPIDefinitionLoading, error: createKPIDefinitionError }] = useMutation<CreateKpiDefinitionMutation, CreateKpiDefinitionMutationVariables>(
    gql(mCreateKPIDefinition)
  )

  const [definitionModel, setDefinitionModel] = useState<KPIDefinitionModel>(initialKPIDefinitionModel)
  const [sdTypeData, setSDTypeData] = useState<SdType>(null)

  const currentNodeNameRef = useRef('')

  useEffect(() => kpiDefinitionDetailData && setDefinitionModel(kpiDefinitionToKPIDefinitionModel(kpiDefinitionDetailData.kpiDefinition)), [kpiDefinitionDetailData])
  useEffect(() => {
    sdTypesData && kpiDefinitionDetailData && setSDTypeData(sdTypesData.sdTypes.find((sdType) => sdType.denotation === kpiDefinitionDetailData.kpiDefinition.sdTypeSpecification))
  }, [sdTypesData, kpiDefinitionDetailData])

  const initiateLogicalOperationNodeModification = (nodeName: string) => {
    currentNodeNameRef.current = nodeName
    showSelectLogicalOperationTypeModal({
      onLogicalOperationTypeSelection: changeLogicalOperationType
    })
  }

  const initiateAtomNodeModification = (nodeName: string) => {
    currentNodeNameRef.current = nodeName
    showAtomNodeModal({
      sdTypeData: sdTypeData,
      onConfirm: reconfigureAtomNode
    })
  }

  const changeLogicalOperationType = (newOperationType: LogicalOperationNodeType): void => {
    setDefinitionModel((definitionModel) =>
      produce(definitionModel, (draftDefinitionModel) => {
        changeTypeOfLogicalOperationNode(currentNodeNameRef.current, draftDefinitionModel, newOperationType)
      })
    )
  }

  const reconfigureAtomNode = (type: AtomNodeType, sdParameterSpecification: string, referenceValue: string | boolean | number) => {
    setDefinitionModel((definitionModel) =>
      produce(definitionModel, (draftDefinitionModel) => {
        modifyAtomNode(currentNodeNameRef.current, draftDefinitionModel, type, sdParameterSpecification, referenceValue)
      })
    )
    hideAtomNodeModal()
  }

  const initiateNewNodeCreation = async (nodeName: string) => {
    currentNodeNameRef.current = nodeName
    await showSelectNewNodeTypeModal({
      initiateNewLogicalOperationNodeCreation: initiateNewLogicalOperationNodeCreation,
      initiateNewAtomNodeCreation: initiateNewAtomNodeCreation
    })
  }

  const initiateNewLogicalOperationNodeCreation = () => {
    hideSelectNewNodeTypeModal()
    showSelectLogicalOperationTypeModal({
      onLogicalOperationTypeSelection: finalizeNewLogicalOperationNodeCreation
    })
  }

  const initiateNewAtomNodeCreation = () => {
    hideSelectNewNodeTypeModal()
    showAtomNodeModal({
      sdTypeData: sdTypeData,
      onConfirm: finalizeNewAtomNodeCreation
    })
  }

  const finalizeNewLogicalOperationNodeCreation = (logicalOperationType: LogicalOperationNodeType) => {
    setDefinitionModel((definitionModel) =>
      produce(definitionModel, (draftDefinitionModel) => {
        crateNewLogicalOperationNode(currentNodeNameRef.current, draftDefinitionModel, logicalOperationType)
      })
    )
    hideSelectLogicalOperationTypeModal()
  }

  const finalizeNewAtomNodeCreation = (type: AtomNodeType, sdParameterSpecification: string, referenceValue: string | boolean | number) => {
    setDefinitionModel((definitionModel) =>
      produce(definitionModel, (draftDefinitionModel) => {
        crateNewAtomNode(currentNodeNameRef.current, draftDefinitionModel, type, sdParameterSpecification, referenceValue)
      })
    )
    hideAtomNodeModal()
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

  const onSubmitHandler = async () => {
    await createKPIDefinitionMutation({
      variables: {
        input: kpiDefinitionModelToKPIDefinitionInput(definitionModel, sdTypeData.denotation)
      }
    })
    navigate('/kpi-definitions')
  }

  const onCancelHandler = () => {
    navigate('/kpi-definitions')
  }

  const updateUserIdentifier = (newUserIdentifier: string) => {
    setDefinitionModel((definitionModel) =>
      produce(definitionModel, (draftDefinitionModel) => {
        draftDefinitionModel.userIdentifier = newUserIdentifier
      })
    )
  }

  return (
    <KPIDetailPageView
      kpiDefinitionModel={definitionModel}
      sdTypesData={sdTypesData}
      sdTypeData={sdTypeData}
      anyLoadingOccurs={kpiDefinitionDetailLoading || sdTypesLoading || createKPIDefinitionLoading}
      anyErrorOccurred={!!kpiDefinitionDetailError || !!sdTypesError || !!createKPIDefinitionError}
      initiateLogicalOperationNodeModification={initiateLogicalOperationNodeModification}
      initiateNewNodeCreation={initiateNewNodeCreation}
      initiateNewLogicalOperationNodeCreation={initiateNewLogicalOperationNodeCreation}
      initiateNewAtomNodeCreation={initiateNewAtomNodeCreation}
      handleSDTypeSelection={handleSDTypeSelection}
      initiateAtomNodeModification={initiateAtomNodeModification}
      onSubmitHandler={onSubmitHandler}
      onCancelHandler={onCancelHandler}
      updateUserIdentifier={updateUserIdentifier}
    />
  )
}

export default KPIDetailPageController
