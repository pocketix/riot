import React, { useEffect, useMemo, useRef, useState } from 'react'
import { produce } from 'immer'
import KPIDetailPageView from './KPIDetailPageView'
import { AtomNodeType, EditableTreeNodeDataModel, LogicalOperationNodeType, NodeType } from './components/editable-tree/EditableTree'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@apollo/client'
import {
  CreateKpiDefinitionMutation,
  CreateKpiDefinitionMutationVariables,
  KpiDefinitionDetailQuery,
  KpiDefinitionDetailQueryVariables,
  SdType,
  SdTypesQuery,
  SdTypesQueryVariables,
  UpdateKpiDefinitionMutation,
  UpdateKpiDefinitionMutationVariables
} from '../../generated/graphql'
import gql from 'graphql-tag'
import qKPIDefinitionDetail from '../../graphql/queries/kpiDefinitionDetail.graphql'
import qSDTypes from '../../graphql/queries/sdTypes.graphql'
import {
  changeTypeOfLogicalOperationNode,
  crateNewAtomNode,
  crateNewLogicalOperationNode,
  initialKPIDefinitionModel,
  kpiDefinitionModelToKPIDefinitionInput,
  kpiDefinitionToKPIDefinitionModel,
  modifyAtomNode
} from './kpiDefinitionModel'
import mCreateKPIDefinition from '../../graphql/mutations/createKPIDefinition.graphql'
import mUpdateKPIDefinition from '../../graphql/mutations/updateKPIDefinition.graphql'
import { useModal } from '@ebay/nice-modal-react'
import SelectNewNodeTypeModal from './components/modals/SelectNewNodeTypeModal'
import SelectLogicalOperationTypeModal from './components/modals/SelectLogicalOperationTypeModal'
import AtomNodeModal, { BinaryRelation } from './components/modals/AtomNodeModal'

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
  const [updateKPIDefinitionMutation, { loading: updateKPIDefinitionLoading, error: updateKPIDefinitionError }] = useMutation<UpdateKpiDefinitionMutation, UpdateKpiDefinitionMutationVariables>(
    gql(mUpdateKPIDefinition)
  )

  const [definitionModel, setDefinitionModel] = useState<KPIDefinitionModel>(initialKPIDefinitionModel)
  const [sdTypeData, setSDTypeData] = useState<SdType | null>(null)

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

  const initiateAtomNodeModification = (nodeName: string, sdParameterSpecification: string, atomNodeType: AtomNodeType, referenceValue: string | number | boolean) => {
    currentNodeNameRef.current = nodeName
    const sdParameter = sdTypeData.parameters.find((sdParameter) => sdParameter.denotation === sdParameterSpecification)
    const binaryRelation = ((atomNodeType: AtomNodeType): BinaryRelation => {
      switch (atomNodeType) {
        case AtomNodeType.StringEQ:
        case AtomNodeType.BooleanEQ:
        case AtomNodeType.NumericEQ:
          return BinaryRelation.EQ
        case AtomNodeType.NumericGT:
          return BinaryRelation.GT
        case AtomNodeType.NumericGEQ:
          return BinaryRelation.GEQ
        case AtomNodeType.NumericLT:
          return BinaryRelation.LT
        case AtomNodeType.NumericLEQ:
          return BinaryRelation.LEQ
      }
    })(atomNodeType)
    const referenceValueString = ((referenceValue: string | number | boolean): string => {
      switch (typeof referenceValue) {
        case 'string':
          return referenceValue
        case 'boolean':
          return referenceValue ? 'true' : 'false'
        case 'number':
          return referenceValue.toString()
      }
    })(referenceValue)
    showAtomNodeModal({
      sdTypeData: sdTypeData,
      onConfirm: reconfigureAtomNode,
      sdParameter: sdParameter,
      binaryRelation: binaryRelation,
      referenceValueString: referenceValueString
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
    const kpiDefinitionInput = kpiDefinitionModelToKPIDefinitionInput(definitionModel, sdTypeData.denotation)
    if (id) {
      await updateKPIDefinitionMutation({
        variables: {
          id: id,
          input: kpiDefinitionInput
        }
      })
    } else {
      await createKPIDefinitionMutation({
        variables: {
          input: kpiDefinitionInput
        }
      })
    }
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

  const canSubmit: boolean = useMemo(() => {
    return !!sdTypeData && definitionModel.attributes.nodeType !== NodeType.NewNode
  }, [sdTypeData, definitionModel])

  return (
    <KPIDetailPageView
      kpiDefinitionModel={definitionModel}
      sdTypesData={sdTypesData}
      sdTypeData={sdTypeData}
      canSubmit={canSubmit}
      anyLoadingOccurs={kpiDefinitionDetailLoading || sdTypesLoading || createKPIDefinitionLoading || updateKPIDefinitionLoading}
      anyErrorOccurred={!!kpiDefinitionDetailError || !!sdTypesError || !!createKPIDefinitionError || !!updateKPIDefinitionError}
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
