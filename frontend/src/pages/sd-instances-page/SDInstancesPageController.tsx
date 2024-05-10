import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useSubscription } from '@apollo/client'
import {
  ConfirmSdInstanceMutation,
  ConfirmSdInstanceMutationVariables,
  OnKpiFulfillmentCheckedSubscription,
  OnKpiFulfillmentCheckedSubscriptionVariables,
  OnSdInstanceRegisteredSubscription,
  OnSdInstanceRegisteredSubscriptionVariables,
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
import sOnSDInstanceRegistered from '../../graphql/subscriptions/onSDInstanceRegistered.graphql'
import sOnKPIFulfillmentChecked from '../../graphql/subscriptions/onKPIFulfillmentChecked.graphql'
import { produce } from 'immer'

const SDInstancesPageController: React.FC = () => {
  const [combinedSDInstancesPageData, setCombinedSDInstancesPageData] = useState<SdInstancesPageDataQuery | null>(null)
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
  const { data: onSDInstanceRegisteredData, error: onSDInstanceRegisteredError } = useSubscription<OnSdInstanceRegisteredSubscription, OnSdInstanceRegisteredSubscriptionVariables>(
    gql(sOnSDInstanceRegistered)
  )
  const { data: onKPIFulfillmentCheckedData, error: onKPIFulfillmentCheckedError } = useSubscription<OnKpiFulfillmentCheckedSubscription, OnKpiFulfillmentCheckedSubscriptionVariables>(
    gql(sOnKPIFulfillmentChecked)
  )

  const anyLoadingOccurs = useMemo(
    () => sdInstancesPageDataLoading || updateUserIdentifierOfSdInstanceLoading || confirmSdInstanceLoading,
    [sdInstancesPageDataLoading, updateUserIdentifierOfSdInstanceLoading, confirmSdInstanceLoading]
  )

  const anyErrorOccurred = useMemo(
    () => !!sdInstancesPageDataError || !!updateUserIdentifierOfSdInstanceError || !!confirmSdInstanceError || !!onSDInstanceRegisteredError || !!onKPIFulfillmentCheckedError,
    [sdInstancesPageDataError, updateUserIdentifierOfSdInstanceError, confirmSdInstanceError, onSDInstanceRegisteredError, onKPIFulfillmentCheckedError]
  )

  const updateUserIdentifierOfSdInstance = useCallback(
    async (id: string, newUserIdentifier: string) => {
      await updateUserIdentifierOfSdInstanceMutation({
        variables: {
          id: id,
          newUserIdentifier: newUserIdentifier
        }
      })
      await sdInstancesPageDataRefetch()
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
      await sdInstancesPageDataRefetch()
    },
    [confirmSdInstanceMutation]
  )

  useEffect(() => {
    setCombinedSDInstancesPageData(sdInstancesPageData)
  }, [sdInstancesPageData])

  useEffect(() => {
    if (!onSDInstanceRegisteredData) {
      return
    }
    setCombinedSDInstancesPageData((combinedSDInstancesPageData) =>
      produce(combinedSDInstancesPageData, (draftCombinedSDInstancesPageData) => {
        const { id, uid, confirmedByUser, userIdentifier, type } = onSDInstanceRegisteredData.onSDInstanceRegistered
        draftCombinedSDInstancesPageData.sdInstances.push({
          id: id,
          uid: uid,
          confirmedByUser: confirmedByUser,
          userIdentifier: userIdentifier,
          type: type
        })
      })
    )
  }, [onSDInstanceRegisteredData])

  useEffect(() => {
    if (!onKPIFulfillmentCheckedData) {
      return
    }
    setCombinedSDInstancesPageData((combinedSDInstancesPageData) =>
      produce(combinedSDInstancesPageData, (draftCombinedSDInstancesPageData) => {
        const { kpiDefinitionID, sdInstanceID, fulfilled } = onKPIFulfillmentCheckedData.onKPIFulfillmentChecked
        const kpiFulfillmentCheckResultIndex = draftCombinedSDInstancesPageData.kpiFulfillmentCheckResults.findIndex((k) => k.kpiDefinitionID === kpiDefinitionID && k.sdInstanceID === sdInstanceID)
        const kpiFulfillmentCheckResult = {
          kpiDefinitionID,
          sdInstanceID,
          fulfilled
        }
        if (kpiFulfillmentCheckResultIndex !== -1) {
          draftCombinedSDInstancesPageData.kpiFulfillmentCheckResults[kpiFulfillmentCheckResultIndex] = kpiFulfillmentCheckResult
        } else {
          draftCombinedSDInstancesPageData.kpiFulfillmentCheckResults.push(kpiFulfillmentCheckResult)
        }
      })
    )
  }, [onKPIFulfillmentCheckedData])

  return (
    <SDInstancesPageView
      sdInstancesPageData={combinedSDInstancesPageData}
      updateUserIdentifierOfSdInstance={updateUserIdentifierOfSdInstance}
      confirmSdInstance={confirmSdInstance}
      anyLoadingOccurs={anyLoadingOccurs}
      anyErrorOccurred={anyErrorOccurred}
    />
  )
}

export default SDInstancesPageController
