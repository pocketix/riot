import React, { useMemo } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { CreateSdTypeMutation, CreateSdTypeMutationVariables, DeleteSdTypeMutation, DeleteSdTypeMutationVariables, SdParameterType, SdTypesQuery, SdTypesQueryVariables } from '../../generated/graphql'
import gql from 'graphql-tag'
import qSDTypes from '../../graphql/queries/sdTypes.graphql'
import SDTypesPageView from './SDTypesPageView'
import mDeleteSDType from '../../graphql/mutations/deleteSDType.graphql'
import mCreateSDType from '../../graphql/mutations/createSDType.graphql'
import { useModal } from '@ebay/nice-modal-react'
import ConfirmDeletionModal from '../../page-independent-components/ConfirmDeletionModal'
import SDTypeModal from './components/SDTypeModal'

const SDTypesPageController: React.FC = () => {
  const { data: sdTypesData, loading: sdTypesLoading, error: sdTypesError, refetch: sdTypesRefetch } = useQuery<SdTypesQuery, SdTypesQueryVariables>(gql(qSDTypes))
  const [deleteSDTypeMutation, { loading: deleteSDTypeLoading, error: deleteSDTypeError }] = useMutation<DeleteSdTypeMutation, DeleteSdTypeMutationVariables>(gql(mDeleteSDType))
  const [createSDTypeMutation, { loading: createSDTypeLoading, error: createSDTypeError }] = useMutation<CreateSdTypeMutation, CreateSdTypeMutationVariables>(gql(mCreateSDType))

  const { show: showSDTypeModal, remove: removeSDTypeModal } = useModal(SDTypeModal)
  const { show: showConfirmDeletionModal, hide: hideConfirmDeletionModal } = useModal(ConfirmDeletionModal)

  const anyLoadingOccurs = useMemo(() => sdTypesLoading || deleteSDTypeLoading || createSDTypeLoading, [sdTypesLoading, deleteSDTypeLoading, createSDTypeLoading])
  const anyErrorOccurred = useMemo(() => !!sdTypesError || !!deleteSDTypeError || !!createSDTypeError, [sdTypesError, deleteSDTypeError, createSDTypeError])

  const initiateSDTypeCreation = () => {
    showSDTypeModal({
      sdTypesQueryData: sdTypesData,
      onConfirm: finalizeSDTypeCreation
    })
  }

  const finalizeSDTypeCreation = async (denotation: string, parameters: { denotation: string; type: 'STRING' | 'NUMBER' | 'BOOLEAN' }[]) => {
    await createSDTypeMutation({
      variables: {
        input: {
          denotation: denotation,
          parameters: parameters.map((p) => {
            return {
              denotation: p.denotation,
              type: p.type as SdParameterType
            }
          })
        }
      }
    })
    await sdTypesRefetch()
    removeSDTypeModal()
  }

  const initiateSDTypeDeletion = (id: string) => {
    showConfirmDeletionModal({
      denotationOfItemToBeDeleted: 'SD type definition',
      onConfirm: async () => {
        await deleteSDTypeMutation({
          variables: {
            id: id
          }
        })
        await sdTypesRefetch()
        await hideConfirmDeletionModal()
      }
    })
  }

  return (
    <SDTypesPageView
      sdTypesData={sdTypesData}
      initiateSDTypeCreation={initiateSDTypeCreation}
      initiateSDTypeDeletion={initiateSDTypeDeletion}
      anyLoadingOccurs={anyLoadingOccurs}
      anyErrorOccurred={anyErrorOccurred}
    />
  )
}

export default SDTypesPageController
