import React, { useCallback, useEffect, useMemo } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import {
  ConfirmSdInstanceMutation,
  ConfirmSdInstanceMutationVariables,
  SdInstancesQuery,
  SdInstancesQueryVariables,
  UpdateUserIdentifierOfSdInstanceMutation,
  UpdateUserIdentifierOfSdInstanceMutationVariables
} from '../../generated/graphql'
import gql from 'graphql-tag'
import qSDInstances from '../../graphql/queries/sdInstances.graphql'
import SDInstancesPageView from './SDInstancesPageView'
import mUpdateUserIdentifierOfSDInstance from '../../graphql/mutations/updateUserIdentifierOfSDInstance.graphql'
import mConfirmSDInstance from '../../graphql/mutations/confirmSDInstance.graphql'

const SDInstancesPageController: React.FC = () => {
  const { data: sdInstancesData, loading: sdInstancesLoading, error: sdInstancesError, refetch: sdInstancesRefetch } = useQuery<SdInstancesQuery, SdInstancesQueryVariables>(gql(qSDInstances))
  const [updateUserIdentifierOfSdInstanceMutation, { loading: updateUserIdentifierOfSdInstanceLoading, error: updateUserIdentifierOfSdInstanceError }] = useMutation<
    UpdateUserIdentifierOfSdInstanceMutation,
    UpdateUserIdentifierOfSdInstanceMutationVariables
  >(gql(mUpdateUserIdentifierOfSDInstance))
  const [confirmSdInstanceMutation, { loading: confirmSdInstanceLoading, error: confirmSdInstanceError }] = useMutation<ConfirmSdInstanceMutation, ConfirmSdInstanceMutationVariables>(
    gql(mConfirmSDInstance)
  )

  const anyLoadingOccurs = useMemo(
    () => sdInstancesLoading || updateUserIdentifierOfSdInstanceLoading || confirmSdInstanceLoading,
    [sdInstancesLoading, updateUserIdentifierOfSdInstanceLoading, confirmSdInstanceLoading]
  )
  const anyErrorOccurred = useMemo(
    () => !!sdInstancesError || !!updateUserIdentifierOfSdInstanceError || !!confirmSdInstanceError,
    [sdInstancesError, updateUserIdentifierOfSdInstanceError, confirmSdInstanceError]
  )

  const refetchSDInstances = useCallback(async () => {
    await sdInstancesRefetch()
  }, [sdInstancesRefetch()])

  const updateUserIdentifierOfSdInstance = useCallback(
    async (id: string, newUserIdentifier: string) => {
      await updateUserIdentifierOfSdInstanceMutation({
        variables: {
          id: id,
          newUserIdentifier: newUserIdentifier
        }
      })
    },
    [updateUserIdentifierOfSdInstanceMutation]
  )

  const confirmSdInstance = useCallback(
    async (id: string) => {
      await confirmSdInstanceMutation({
        variables: {
          id: id
        }
      })
    },
    [confirmSdInstanceMutation]
  )

  useEffect(() => {
    // TODO: Replace this polling by GraphQL subscription once feasible
    const timeout = setInterval(() => {
      refetchSDInstances().catch((error) => {
        console.error('Failed to refetch SD instances:', error)
      })
    }, 500)
    return () => clearInterval(timeout)
  }, [refetchSDInstances])

  return (
    <SDInstancesPageView
      sdInstancesData={sdInstancesData}
      updateUserIdentifierOfSdInstance={updateUserIdentifierOfSdInstance}
      confirmSdInstance={confirmSdInstance}
      anyLoadingOccurs={anyLoadingOccurs}
      anyErrorOccurred={anyErrorOccurred}
    />
  )
}

export default SDInstancesPageController
