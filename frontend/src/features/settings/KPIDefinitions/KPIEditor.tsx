import KPIDetailPageView from './KPIDetailPageView'
import {
  CreateKpiDefinitionMutation,
  CreateKpiDefinitionMutationVariables,
  KpiDefinitionDetailQuery,
  KpiDefinitionDetailQueryVariables,
  RestOfKpiDefinitionDetailPageDataQuery,
  RestOfKpiDefinitionDetailPageDataQueryVariables,
  SdInstanceMode,
  SdType,
  UpdateKpiDefinitionMutation,
  UpdateKpiDefinitionMutationVariables
} from '@/generated/graphql'
import { produce } from 'immer'
import {
  AtomNodeType,
  EditableTreeNodeDataModel,
  LogicalOperationNodeType,
  NodeType
} from './components/editable-tree/EditableTree'
import SelectNewNodeTypeModal from './components/modals/SelectNewNodeTypeModal'
import { useModal } from '@ebay/nice-modal-react'
import SelectLogicalOperationTypeModal from './components/modals/SelectLogicalOperationTypeModal'
import AtomNodeModal, { BinaryRelation } from './components/modals/AtomNodeModal'
import { generateNewUUID, useChangeURL } from './components/util'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@apollo/client'
import { GET_KPI_DEFINITION_DETAILS, GET_REST_OF_KPI_DEFINITION_DETAIL_PAGE_DATA } from '@/graphql/Queries'
import { CREATE_KPI_DEFINITION, UPDATE_KPI_DEFINITION } from '@/graphql/Mutations'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  changeTypeOfLogicalOperationNode,
  crateNewAtomNode,
  crateNewLogicalOperationNode,
  initialKPIDefinitionModel,
  kpiDefinitionModelToKPIDefinitionInput,
  kpiDefinitionToKPIDefinitionModel,
  modifyAtomNode
} from './kpiDefinitionModel'
import { toast } from 'sonner'

export interface KPIDefinitionModel extends EditableTreeNodeDataModel {
  id: number
  userIdentifier: string
  sdInstanceMode: SdInstanceMode
  selectedSDInstanceUIDs: string[]
}

export default function KPIEditor() {
  const { show: showSelectNewNodeTypeModal, remove: removeSelectNewNodeTypeModal } = useModal(SelectNewNodeTypeModal)
  const { show: showSelectLogicalOperationTypeModal, remove: removeSelectLogicalOperationTypeModal } = useModal(
    SelectLogicalOperationTypeModal
  )
  const { show: showAtomNodeModal, remove: removeAtomNodeModal } = useModal(AtomNodeModal)

  const changeURL = useChangeURL()

  const { id } = useParams()

  const {
    data: kpiDefinitionDetailData,
    loading: kpiDefinitionDetailLoading,
    error: kpiDefinitionDetailError
  } = useQuery<KpiDefinitionDetailQuery, KpiDefinitionDetailQueryVariables>(GET_KPI_DEFINITION_DETAILS, {
    skip: !id,
    variables: {
      id: Number(id)
    }
  })

  const {
    data: restOfKPIDefinitionDetailPageData,
    loading: restOfKPIDefinitionDetailPageDataLoading,
    error: restOfKPIDefinitionDetailPageDataError
  } = useQuery<RestOfKpiDefinitionDetailPageDataQuery, RestOfKpiDefinitionDetailPageDataQueryVariables>(
    GET_REST_OF_KPI_DEFINITION_DETAIL_PAGE_DATA
  )

  const [createKPIDefinitionMutation, { loading: createKPIDefinitionLoading, error: createKPIDefinitionError }] =
    useMutation<CreateKpiDefinitionMutation, CreateKpiDefinitionMutationVariables>(CREATE_KPI_DEFINITION)

  const [updateKPIDefinitionMutation, { loading: updateKPIDefinitionLoading, error: updateKPIDefinitionError }] =
    useMutation<UpdateKpiDefinitionMutation, UpdateKpiDefinitionMutationVariables>(UPDATE_KPI_DEFINITION)

  const [definitionModel, setDefinitionModel] = useState<KPIDefinitionModel>(initialKPIDefinitionModel)
  const [sdTypeData, setSDTypeData] = useState<SdType | null>(null)

  const currentNodeNameRef = useRef('')

  useEffect(
    () =>
      kpiDefinitionDetailData?.kpiDefinition &&
      setDefinitionModel(kpiDefinitionToKPIDefinitionModel(kpiDefinitionDetailData.kpiDefinition)),
    [kpiDefinitionDetailData]
  )

  useEffect(() => {
    if (!restOfKPIDefinitionDetailPageData?.sdTypes || !kpiDefinitionDetailData?.kpiDefinition?.sdTypeSpecification) {
      return
    }

    const matchedSDType = restOfKPIDefinitionDetailPageData.sdTypes.find(
      (sdType) => sdType.denotation === kpiDefinitionDetailData.kpiDefinition.sdTypeSpecification
    )

    setSDTypeData((matchedSDType as SdType) ?? null)
  }, [restOfKPIDefinitionDetailPageData, kpiDefinitionDetailData])

  const initiateLogicalOperationNodeModification = (nodeName: string) => {
    currentNodeNameRef.current = nodeName
    showSelectLogicalOperationTypeModal({
      onLogicalOperationTypeSelection: changeLogicalOperationType
    })
  }

  const initiateAtomNodeModification = (
    nodeName: string,
    sdParameterSpecification: string,
    atomNodeType: AtomNodeType,
    referenceValue: string | number | boolean
  ) => {
    currentNodeNameRef.current = nodeName
    const sdParameter = sdTypeData?.parameters.find(
      (sdParameter) => sdParameter.denotation === sdParameterSpecification
    )
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
      sdTypeData: sdTypeData ?? undefined,
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
  const reconfigureAtomNode = (
    type: AtomNodeType,
    sdParameterID: number,
    sdParameterSpecification: string,
    referenceValue: string | boolean | number
  ) => {
    setDefinitionModel((definitionModel) =>
      produce(definitionModel, (draftDefinitionModel) => {
        modifyAtomNode(
          currentNodeNameRef.current,
          draftDefinitionModel,
          type,
          sdParameterID,
          sdParameterSpecification,
          referenceValue
        )
      })
    )
    removeAtomNodeModal()
  }

  const initiateNewNodeCreation = async (nodeName: string) => {
    currentNodeNameRef.current = nodeName
    await showSelectNewNodeTypeModal({
      initiateNewLogicalOperationNodeCreation: initiateNewLogicalOperationNodeCreation,
      initiateNewAtomNodeCreation: initiateNewAtomNodeCreation
    })
  }

  const initiateNewLogicalOperationNodeCreation = () => {
    removeSelectNewNodeTypeModal()
    showSelectLogicalOperationTypeModal({
      onLogicalOperationTypeSelection: finalizeNewLogicalOperationNodeCreation
    })
  }
  const initiateNewAtomNodeCreation = () => {
    removeSelectNewNodeTypeModal()
    showAtomNodeModal({
      sdTypeData: sdTypeData ?? undefined,
      onConfirm: finalizeNewAtomNodeCreation
    })
  }
  const finalizeNewLogicalOperationNodeCreation = (logicalOperationType: LogicalOperationNodeType) => {
    setDefinitionModel((definitionModel) =>
      produce(definitionModel, (draftDefinitionModel) => {
        crateNewLogicalOperationNode(currentNodeNameRef.current, draftDefinitionModel, logicalOperationType)
      })
    )
    removeSelectLogicalOperationTypeModal()
  }

  const finalizeNewAtomNodeCreation = (
    type: AtomNodeType,
    sdParameterID: number,
    sdParameterSpecification: string,
    referenceValue: string | boolean | number
  ) => {
    setDefinitionModel((definitionModel) =>
      produce(definitionModel, (draftDefinitionModel) => {
        crateNewAtomNode(
          currentNodeNameRef.current,
          draftDefinitionModel,
          type,
          sdParameterID,
          sdParameterSpecification,
          referenceValue
        )
      })
    )
    removeAtomNodeModal()
  }

  return (
    <KPIDetailPageView
      pageTitle={`KPI editor – ${id ? 'Edit' : 'Create'} KPI definition`}
      reset={() => {
        currentNodeNameRef.current = ''
        setSDTypeData(null)
        setDefinitionModel(initialKPIDefinitionModel)
      }}
      kpiDefinitionModel={definitionModel}
      restOfKPIDefinitionDetailPageData={restOfKPIDefinitionDetailPageData!}
      sdTypeData={sdTypeData!}
      canSubmit={useMemo(() => {
        return !!sdTypeData && definitionModel.attributes?.nodeType !== NodeType.NewNode
      }, [sdTypeData, definitionModel])}
      anyLoadingOccurs={
        kpiDefinitionDetailLoading ||
        restOfKPIDefinitionDetailPageDataLoading ||
        createKPIDefinitionLoading ||
        updateKPIDefinitionLoading
      }
      anyErrorOccurred={
        !!kpiDefinitionDetailError ||
        !!restOfKPIDefinitionDetailPageDataError ||
        !!createKPIDefinitionError ||
        !!updateKPIDefinitionError
      }
      initiateLogicalOperationNodeModification={initiateLogicalOperationNodeModification}
      initiateNewNodeCreation={initiateNewNodeCreation}
      initiateNewLogicalOperationNodeCreation={initiateNewLogicalOperationNodeCreation}
      initiateNewAtomNodeCreation={initiateNewAtomNodeCreation}
      handleSDTypeSelection={(sdTypeID: number | string) => {
        if (!restOfKPIDefinitionDetailPageData?.sdTypes) {
          return
        }
        const selectedSDType = restOfKPIDefinitionDetailPageData.sdTypes.find((sdType) => sdType.id === sdTypeID)
        if (!selectedSDType || (sdTypeData && selectedSDType.id === sdTypeData.id)) {
          return
        }
        setSDTypeData(selectedSDType as SdType)
        setDefinitionModel((definitionModel) =>
          produce(definitionModel, (draftDefinitionModel) => {
            draftDefinitionModel.name = generateNewUUID()
            draftDefinitionModel.attributes = {
              nodeType: NodeType.NewNode
            }
            draftDefinitionModel.children = []
            draftDefinitionModel.selectedSDInstanceUIDs = []
          })
        )
      }}
      handleSDInstanceModeSelection={(sdInstanceMode: SdInstanceMode) => {
        setDefinitionModel((definitionModel) =>
          produce(definitionModel, (draftDefinitionModel) => {
            draftDefinitionModel.sdInstanceMode = sdInstanceMode
          })
        )
      }}
      initiateAtomNodeModification={initiateAtomNodeModification}
      onSubmitHandler={async () => {
        const kpiDefinitionInput = kpiDefinitionModelToKPIDefinitionInput(
          definitionModel,
          sdTypeData!.id,
          sdTypeData!.denotation
        )
        if (id) {
          await updateKPIDefinitionMutation({
            variables: {
              id: Number(id),
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
        changeURL('/settings/kpi-definitions')
        toast.success('KPI Definition saved successfully')
      }}
      onCancelHandler={() => changeURL('/settings/kpi-definitions')}
      updateUserIdentifier={(newUserIdentifier: string) => {
        setDefinitionModel((definitionModel) =>
          produce(definitionModel, (draftDefinitionModel) => {
            draftDefinitionModel.userIdentifier = newUserIdentifier
          })
        )
      }}
      updateSelectedSDInstanceUIDs={(selectedSDInstanceUIDs: string[]) => {
        setDefinitionModel((definitionModel) =>
          produce(definitionModel, (draftDefinitionModel) => {
            draftDefinitionModel.selectedSDInstanceUIDs = selectedSDInstanceUIDs
          })
        )
      }}
    />
  )
}
