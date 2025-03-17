import React from 'react'
import KPIPageView from './KPIPageView'
import { useMutation, useQuery } from '@apollo/client'
import { DeleteKpiDefinitionMutation, DeleteKpiDefinitionMutationVariables, KpiDefinitionsQuery, KpiDefinitionsQueryVariables } from '../../generated/graphql'
import gql from 'graphql-tag'
import qKPIDefinitions from '../../graphql/queries/kpiDefinitions.graphql'
import { useModal } from '@ebay/nice-modal-react'
import ConfirmDeletionModal from '../../page-independent-components/ConfirmDeletionModal'
import mDeleteKPIDefinition from '../../graphql/mutations/deleteKPIDefinition.graphql'

const KPIPageController: React.FC = () => {
  const {
    data: kpiDefinitionsQueryData,
    loading: kpiDefinitionsQueryLoading,
    error: kpiDefinitionsQueryError,
    refetch: kpiDefinitionsQueryRefetch
  } = useQuery<KpiDefinitionsQuery, KpiDefinitionsQueryVariables>(gql(qKPIDefinitions))
  
  const [deleteKPIDefinitionMutation, { loading: deleteKPIDefinitionLoading, error: deleteKPIDefinitionError }] = useMutation<DeleteKpiDefinitionMutation, DeleteKpiDefinitionMutationVariables>(
    gql(mDeleteKPIDefinition)
  )

  const { show: showConfirmDeletionModal, hide: hideConfirmDeletionModal } = useModal(ConfirmDeletionModal)

  const initiateKPIDefinitionDeletion = (id: string) => {
    showConfirmDeletionModal({
      denotationOfItemToBeDeleted: 'KPI definition',
      onConfirm: async () => {
        await deleteKPIDefinitionMutation({
          variables: {
            id: id
          }
        })
        await kpiDefinitionsQueryRefetch()
        await hideConfirmDeletionModal()
      }
    })
  }

  return (
    <KPIPageView
      kpiDefinitionsData={kpiDefinitionsQueryData}
      initiateKPIDefinitionDeletion={initiateKPIDefinitionDeletion}
      anyLoadingOccurs={kpiDefinitionsQueryLoading || deleteKPIDefinitionLoading}
      anyErrorOccurred={!!kpiDefinitionsQueryError || !!deleteKPIDefinitionError}
    ></KPIPageView>
  )
}

export default KPIPageController
