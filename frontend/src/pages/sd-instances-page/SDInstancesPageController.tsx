import React, { useCallback, useEffect, useMemo } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import {
  ConfirmSdInstanceMutation,
  ConfirmSdInstanceMutationVariables,
  SdInstancesPageDataQuery,
  SdInstancesPageDataQueryVariables,
  UpdateUserIdentifierOfSdInstanceMutation,
  UpdateUserIdentifierOfSdInstanceMutationVariables
} from '../../generated/graphql'
import gql from 'graphql-tag'
import qSDInstancesPageData from '../../graphql/queries/sdInstancesPageData.graphql'
import SDInstancesPageView from './SDInstancesPageView'
import mUpdateUserIdentifierOfSDInstance from '../../graphql/mutations/updateUserIdentifierOfSDInstance.graphql'
import mConfirmSDInstance from '../../graphql/mutations/confirmSDInstance.graphql'

const SDInstancesPageController: React.FC = () => {
  const {
    data: sdInstancesPageData,
    loading: sdInstancesPageDataLoading,
    error: sdInstancesPageDataError,
    refetch: sdInstancesPageDataRefetch
  } = useQuery<SdInstancesPageDataQuery, SdInstancesPageDataQueryVariables>(gql(qSDInstancesPageData))
  const [updateUserIdentifierOfSdInstanceMutation, { loading: updateUserIdentifierOfSdInstanceLoading, error: updateUserIdentifierOfSdInstanceError }] = useMutation<
    UpdateUserIdentifierOfSdInstanceMutation,
    UpdateUserIdentifierOfSdInstanceMutationVariables
  >(gql(mUpdateUserIdentifierOfSDInstance))
  const [confirmSdInstanceMutation, { loading: confirmSdInstanceLoading, error: confirmSdInstanceError }] = useMutation<ConfirmSdInstanceMutation, ConfirmSdInstanceMutationVariables>(
    gql(mConfirmSDInstance)
  )

  const anyLoadingOccurs = useMemo(
    () => sdInstancesPageDataLoading || updateUserIdentifierOfSdInstanceLoading || confirmSdInstanceLoading,
    [sdInstancesPageDataLoading, updateUserIdentifierOfSdInstanceLoading, confirmSdInstanceLoading]
  )

  const anyErrorOccurred = useMemo(
    () => !!sdInstancesPageDataError || !!updateUserIdentifierOfSdInstanceError || !!confirmSdInstanceError,
    [sdInstancesPageDataError, updateUserIdentifierOfSdInstanceError, confirmSdInstanceError]
  )

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
      sdInstancesPageDataRefetch().catch((error) => {
        console.error('Failed to refetch SD instances page data:', error)
      })
    }, 500)
    return () => clearInterval(timeout)
  }, [sdInstancesPageDataRefetch])

  return (
    <SDInstancesPageView
      sdInstancesPageData={sdInstancesPageData}
      updateUserIdentifierOfSdInstance={updateUserIdentifierOfSdInstance}
      confirmSdInstance={confirmSdInstance}
      anyLoadingOccurs={anyLoadingOccurs}
      anyErrorOccurred={anyErrorOccurred}
    />
  )
}

export default SDInstancesPageController
