import React, { useEffect, useMemo, useRef, useState } from 'react'
import SDInstanceGroupsPageView, { SDInstanceGroupData } from './SDInstanceGroupsPageView'
import { useMutation, useQuery, useSubscription } from '@apollo/client'
import {
  CreateSdInstanceGroupMutation,
  CreateSdInstanceGroupMutationVariables,
  DeleteSdInstanceGroupMutation,
  DeleteSdInstanceGroupMutationVariables,
  OnKpiFulfillmentCheckedSubscription,
  OnKpiFulfillmentCheckedSubscriptionVariables,
  SdInstanceGroupsPageDataQuery,
  SdInstanceGroupsPageDataQueryVariables,
  SdInstanceMode,
  UpdateSdInstanceGroupMutation,
  UpdateSdInstanceGroupMutationVariables
} from '../../generated/graphql'
import qSDInstanceGroupsPageData from './../../graphql/queries/sdInstanceGroupsPageData.graphql'
import gql from 'graphql-tag'
import { KPIFulfillmentState } from '../../page-independent-components/KPIFulfillmentCheckResultSection'
import sOnKPIFulfillmentChecked from '../../graphql/subscriptions/onKPIFulfillmentChecked.graphql'
import { produce } from 'immer'
import { useModal } from '@ebay/nice-modal-react'
import SDInstanceGroupModal, { SDInstanceGroupModalMode } from './components/SDInstanceGroupModal'
import mCreateSDInstanceGroup from '../../graphql/mutations/createSDInstanceGroup.graphql'
import mUpdateSDInstanceGroup from '../../graphql/mutations/updateSDInstanceGroup.graphql'
import mDeleteSDInstanceGroup from '../../graphql/mutations/deleteSDInstanceGroup.graphql'

const SDInstanceGroupsPageController: React.FC = () => {
  const { data, loading, error } = useQuery<SdInstanceGroupsPageDataQuery, SdInstanceGroupsPageDataQueryVariables>(gql(qSDInstanceGroupsPageData))
  const { data: onKPIFulfillmentCheckedData, error: onKPIFulfillmentCheckedError } = useSubscription<OnKpiFulfillmentCheckedSubscription, OnKpiFulfillmentCheckedSubscriptionVariables>(
    gql(sOnKPIFulfillmentChecked)
  )
  const [createSDInstanceGroupMutation, { data: createSDInstanceGroupData, loading: createSDInstanceGroupLoading, error: createSDInstanceGroupError }] = useMutation<
    CreateSdInstanceGroupMutation,
    CreateSdInstanceGroupMutationVariables
  >(gql(mCreateSDInstanceGroup))
  const [updateSDInstanceGroupMutation, { data: updateSDInstanceGroupData, loading: updateSDInstanceGroupLoading, error: updateSDInstanceGroupError }] = useMutation<
    UpdateSdInstanceGroupMutation,
    UpdateSdInstanceGroupMutationVariables
  >(gql(mUpdateSDInstanceGroup))
  const [deleteSDInstanceGroupMutation, { data: deleteSDInstanceGroupData, loading: deleteSDInstanceGroupLoading, error: deleteSDInstanceGroupError }] = useMutation<
    DeleteSdInstanceGroupMutation,
    DeleteSdInstanceGroupMutationVariables
  >(gql(mDeleteSDInstanceGroup))

  const [sdInstanceGroupsPageData, setSDInstanceGroupsPageData] = useState<SdInstanceGroupsPageDataQuery | null>(null)
  const [finalSDInstanceGroupsPageData, setFinalSDInstanceGroupsPageData] = useState<SDInstanceGroupData[]>([])

  const currentlyDeletedSDInstanceGroupIDRef = useRef<string>('')

  const { show: showSDInstanceGroupModal, remove: removeSDInstanceGroupModal } = useModal(SDInstanceGroupModal)

  const userConfirmedSDInstancesData: {
    id: string
    userIdentifier: string
  }[] = useMemo(() => {
    return (
      sdInstanceGroupsPageData?.sdInstances
        .filter(({ confirmedByUser }) => confirmedByUser)
        .map(({ id, userIdentifier }) => ({
          id: id,
          userIdentifier: userIdentifier
        })) ?? []
    )
  }, [sdInstanceGroupsPageData])

  const initiateSDInstanceGroupCreation = () => {
    showSDInstanceGroupModal({
      mode: SDInstanceGroupModalMode.create,
      sdInstanceData: userConfirmedSDInstancesData,
      createSDInstanceGroup: finalizeSDInstanceGroupCreation
    })
  }

  const finalizeSDInstanceGroupCreation = async (sdInstanceGroupUserIdentifier: string, selectedSDInstanceIDs: string[]) => {
    await createSDInstanceGroupMutation({
      variables: {
        input: {
          sdInstanceIDs: selectedSDInstanceIDs,
          userIdentifier: sdInstanceGroupUserIdentifier
        }
      }
    })
    removeSDInstanceGroupModal()
  }

  const initiateSDInstanceGroupUpdate = (id: string) => {
    const targetSDInstanceGroup = sdInstanceGroupsPageData.sdInstanceGroups.find((sdInstanceGroup) => sdInstanceGroup.id === id)
    if (!targetSDInstanceGroup) {
      console.warn(`Couldn't find SD instance group with ID = ${id}`)
      return
    }
    showSDInstanceGroupModal({
      mode: SDInstanceGroupModalMode.update,
      sdInstanceData: userConfirmedSDInstancesData,
      updateSDInstanceGroup: finalizeSDInstanceGroupUpdate,
      sdInstanceGroupID: id,
      userIdentifier: targetSDInstanceGroup.userIdentifier,
      selectedSDInstanceIDs: targetSDInstanceGroup.sdInstanceIDs
    })
  }

  const finalizeSDInstanceGroupUpdate = async (id: string, sdInstanceGroupUserIdentifier: string, selectedSDInstanceIDs: string[]) => {
    await updateSDInstanceGroupMutation({
      variables: {
        id: id,
        input: {
          userIdentifier: sdInstanceGroupUserIdentifier,
          sdInstanceIDs: selectedSDInstanceIDs
        }
      }
    })
    removeSDInstanceGroupModal()
  }

  const deleteSDInstanceGroup = async (id: string) => {
    currentlyDeletedSDInstanceGroupIDRef.current = id
    await deleteSDInstanceGroupMutation({
      variables: {
        id: id
      }
    })
  }

  useEffect(() => {
    setSDInstanceGroupsPageData(data ?? null)
  }, [data])

  useEffect(() => {
    if (!createSDInstanceGroupData?.createSDInstanceGroup) {
      return
    }
    const { id, userIdentifier, sdInstanceIDs } = createSDInstanceGroupData.createSDInstanceGroup
    setSDInstanceGroupsPageData((sdInstanceGroupsPageData) =>
      produce(sdInstanceGroupsPageData, (draftSDInstanceGroupsPageData) => {
        draftSDInstanceGroupsPageData.sdInstanceGroups.push({
          id: id,
          userIdentifier: userIdentifier,
          sdInstanceIDs: sdInstanceIDs
        })
      })
    )
  }, [createSDInstanceGroupData])

  useEffect(() => {
    if (!updateSDInstanceGroupData?.updateSDInstanceGroup) {
      return
    }
    const { id, userIdentifier, sdInstanceIDs } = updateSDInstanceGroupData.updateSDInstanceGroup
    setSDInstanceGroupsPageData((sdInstanceGroupsPageData) =>
      produce(sdInstanceGroupsPageData, (draftSDInstanceGroupsPageData) => {
        const index = draftSDInstanceGroupsPageData.sdInstanceGroups.findIndex((s) => s.id === id)
        draftSDInstanceGroupsPageData.sdInstanceGroups[index] = {
          id: id,
          userIdentifier: userIdentifier,
          sdInstanceIDs: sdInstanceIDs
        }
      })
    )
  }, [updateSDInstanceGroupData])

  useEffect(() => {
    if (!deleteSDInstanceGroupData?.deleteSDInstanceGroup || !!deleteSDInstanceGroupError) {
      return
    }
    const currentlyDeletedSDInstanceGroupID = currentlyDeletedSDInstanceGroupIDRef.current
    setSDInstanceGroupsPageData((sdInstanceGroupsPageData) =>
      produce(sdInstanceGroupsPageData, (draftSDInstanceGroupsPageData) => {
        draftSDInstanceGroupsPageData.sdInstanceGroups = draftSDInstanceGroupsPageData.sdInstanceGroups.filter((sdInstanceGroup) => sdInstanceGroup.id !== currentlyDeletedSDInstanceGroupID)
      })
    )
  }, [deleteSDInstanceGroupData, deleteSDInstanceGroupError])

  useEffect(() => {
    if (!sdInstanceGroupsPageData || !onKPIFulfillmentCheckedData?.onKPIFulfillmentChecked) {
      return
    }
    setSDInstanceGroupsPageData((sdInstanceGroupsPageData) =>
      produce(sdInstanceGroupsPageData, (draftSDInstanceGroupsPageData) => {
        onKPIFulfillmentCheckedData.onKPIFulfillmentChecked.kpiFulfillmentCheckResults.forEach(({ kpiDefinitionID, sdInstanceID, fulfilled }) => {
          const kpiFulfillmentCheckResultIndex = draftSDInstanceGroupsPageData.kpiFulfillmentCheckResults.findIndex((k) => k.kpiDefinitionID === kpiDefinitionID && k.sdInstanceID === sdInstanceID)
          const kpiFulfillmentCheckResult = {
            kpiDefinitionID,
            sdInstanceID,
            fulfilled
          }
          if (kpiFulfillmentCheckResultIndex !== -1) {
            draftSDInstanceGroupsPageData.kpiFulfillmentCheckResults[kpiFulfillmentCheckResultIndex] = kpiFulfillmentCheckResult
          } else {
            draftSDInstanceGroupsPageData.kpiFulfillmentCheckResults.push(kpiFulfillmentCheckResult)
          }
        })
      })
    )
  }, [onKPIFulfillmentCheckedData])

  useEffect(() => {
    const data = sdInstanceGroupsPageData
    if (!data?.sdInstances || !data?.sdInstanceGroups || !data?.kpiDefinitions || !data?.kpiFulfillmentCheckResults) {
      return
    }
    const sdInstanceUserIdentifierByIDMap: { [key: string]: string } = data.sdInstances.reduce(
      (map, sdInstance) => ({
        ...map,
        [sdInstance.id]: sdInstance.userIdentifier
      }),
      {}
    )
    const kpiDefinitionUserIdentifierByIDMap: { [key: string]: string } = data.kpiDefinitions.reduce(
      (map, kpiDefinition) => ({
        ...map,
        [kpiDefinition.id]: kpiDefinition.userIdentifier
      }),
      {}
    )
    const finalSDInstanceGroupsPageData: SDInstanceGroupData[] = data.sdInstanceGroups.map((sdInstanceGroup) => {
      const sdTypeIDs = data.sdInstances.filter((s) => sdInstanceGroup.sdInstanceIDs.some((sdInstanceID) => sdInstanceID === s.id)).map((s) => s.type.id)
      const kpiDefinitions = data.kpiDefinitions.filter((kpiDefinition) => {
        const correspondingSDType = sdTypeIDs.indexOf(kpiDefinition.sdTypeID) !== -1
        data.sdInstances.filter((sdInstance) => sdInstanceGroup.sdInstanceIDs.indexOf(sdInstance.id) !== -1)
        const sdInstanceUIDIntersection = data.sdInstances
          .filter((sdInstance) => sdInstanceGroup.sdInstanceIDs.indexOf(sdInstance.id) !== -1)
          .map((sdInstance) => sdInstance.uid)
          .some((sdInstanceUID) => kpiDefinition.selectedSDInstanceUIDs.indexOf(sdInstanceUID) !== -1)
        const atLeastOneCorrespondingSDInstanceInGroup = kpiDefinition.sdInstanceMode === SdInstanceMode.All || sdInstanceUIDIntersection
        return correspondingSDType && atLeastOneCorrespondingSDInstanceInGroup
      })
      const kpiFulfillmentStateByKPIDefinitionIDMap: { [key: string]: KPIFulfillmentState } = kpiDefinitions.reduce(
        (map, { id }) => ({
          ...map,
          [id]: KPIFulfillmentState.Unknown
        }),
        {}
      )
      const kpiFulfillmentCheckResults = data.kpiFulfillmentCheckResults.filter((k) => sdInstanceGroup.sdInstanceIDs.some((sdInstanceID) => sdInstanceID === k.sdInstanceID))
      kpiFulfillmentCheckResults.forEach(({ kpiDefinitionID, fulfilled }) => {
        if (kpiFulfillmentStateByKPIDefinitionIDMap[kpiDefinitionID] === KPIFulfillmentState.Unknown) {
          kpiFulfillmentStateByKPIDefinitionIDMap[kpiDefinitionID] = fulfilled ? KPIFulfillmentState.Fulfilled : KPIFulfillmentState.Unfulfilled
        } else if (kpiFulfillmentStateByKPIDefinitionIDMap[kpiDefinitionID] === KPIFulfillmentState.Fulfilled && !fulfilled) {
          kpiFulfillmentStateByKPIDefinitionIDMap[kpiDefinitionID] = KPIFulfillmentState.Unfulfilled
        }
      })
      return {
        id: sdInstanceGroup.id,
        userIdentifier: sdInstanceGroup.userIdentifier,
        sdInstanceData: sdInstanceGroup.sdInstanceIDs.map((sdInstanceID) => ({
          id: sdInstanceID,
          userIdentifier: sdInstanceUserIdentifierByIDMap[sdInstanceID]
        })),
        kpiDefinitionData: Object.keys(kpiFulfillmentStateByKPIDefinitionIDMap).map((kpiDefinitionID) => {
          return {
            id: kpiDefinitionID,
            userIdentifier: kpiDefinitionUserIdentifierByIDMap[kpiDefinitionID],
            fulfillmentState: kpiFulfillmentStateByKPIDefinitionIDMap[kpiDefinitionID]
          }
        })
      }
    })
    setFinalSDInstanceGroupsPageData(finalSDInstanceGroupsPageData)
  }, [sdInstanceGroupsPageData])

  return (
    <SDInstanceGroupsPageView
      sdInstanceGroupsPageData={finalSDInstanceGroupsPageData}
      anyLoadingOccurs={loading || createSDInstanceGroupLoading || updateSDInstanceGroupLoading || deleteSDInstanceGroupLoading}
      anyErrorOccurred={!!error || !!onKPIFulfillmentCheckedError || !!createSDInstanceGroupError || !!updateSDInstanceGroupError || !!deleteSDInstanceGroupError}
      initiateSDInstanceGroupCreation={initiateSDInstanceGroupCreation}
      initiateSDInstanceGroupUpdate={initiateSDInstanceGroupUpdate}
      deleteSDInstanceGroup={deleteSDInstanceGroup}
    />
  )
}

export default SDInstanceGroupsPageController
