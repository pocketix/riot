import React, { useEffect, useState } from 'react'
import SDInstanceGroupsPageView, { SDInstanceGroupData } from './SDInstanceGroupsPageView'
import { useQuery, useSubscription } from '@apollo/client'
import { OnKpiFulfillmentCheckedSubscription, OnKpiFulfillmentCheckedSubscriptionVariables, SdInstanceGroupsPageDataQuery, SdInstanceGroupsPageDataQueryVariables } from '../../generated/graphql'
import qSDInstanceGroupsPageData from './../../graphql/queries/sdInstanceGroupsPageData.graphql'
import gql from 'graphql-tag'
import { KPIFulfillmentState } from '../../page-independent-components/KPIFulfillmentCheckResultSection'
import sOnKPIFulfillmentChecked from '../../graphql/subscriptions/onKPIFulfillmentChecked.graphql'
import { produce } from 'immer'

const SDInstanceGroupsPageController: React.FC = () => {
  const { data, loading, error } = useQuery<SdInstanceGroupsPageDataQuery, SdInstanceGroupsPageDataQueryVariables>(gql(qSDInstanceGroupsPageData))
  const { data: onKPIFulfillmentCheckedData, error: onKPIFulfillmentCheckedError } = useSubscription<OnKpiFulfillmentCheckedSubscription, OnKpiFulfillmentCheckedSubscriptionVariables>(
    gql(sOnKPIFulfillmentChecked)
  )

  const [sdInstanceGroupsPageData, setSDInstanceGroupsPageData] = useState<SdInstanceGroupsPageDataQuery | null>(null)
  const [finalSDInstanceGroupsPageData, setFinalSDInstanceGroupsPageData] = useState<SDInstanceGroupData[]>([])

  useEffect(() => {
    setSDInstanceGroupsPageData(data)
  }, [data])

  useEffect(() => {
    if (!onKPIFulfillmentCheckedData) {
      return
    }
    setSDInstanceGroupsPageData((sdInstanceGroupsPageData) =>
      produce(sdInstanceGroupsPageData, (draftSDInstanceGroupsPageData) => {
        const { kpiDefinitionID, sdInstanceID, fulfilled } = onKPIFulfillmentCheckedData.onKPIFulfillmentChecked
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
      const kpiDefinitions = data.kpiDefinitions.filter((k) => sdTypeIDs.some((sdTypeID) => sdTypeID === k.sdTypeID))
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
  return <SDInstanceGroupsPageView sdInstanceGroupsPageData={finalSDInstanceGroupsPageData} anyLoadingOccurs={loading} anyErrorOccurred={!!error || !!onKPIFulfillmentCheckedError} />
}

export default SDInstanceGroupsPageController
