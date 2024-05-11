import React, { useEffect, useState } from 'react'
import SDInstanceGroupsPageView, { SDInstanceGroupData } from './SDInstanceGroupsPageView'
import { useQuery } from '@apollo/client'
import { SdInstanceGroupsPageDataQuery, SdInstanceGroupsPageDataQueryVariables } from '../../generated/graphql'
import qSDInstanceGroupsPageData from './../../graphql/queries/sdInstanceGroupsPageData.graphql'
import gql from 'graphql-tag'
import { KPIFulfillmentState } from '../../page-independent-components/KPIFulfillmentCheckResultSection'

const SDInstanceGroupsPageController: React.FC = () => {
  const { data, loading, error } = useQuery<SdInstanceGroupsPageDataQuery, SdInstanceGroupsPageDataQueryVariables>(gql(qSDInstanceGroupsPageData))
  const [sdInstanceGroupsPageData, setSDInstanceGroupsPageData] = useState<SDInstanceGroupData[]>([])
  useEffect(() => {
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
    const sdInstanceGroupsPageData: SDInstanceGroupData[] = data.sdInstanceGroups.map((sdInstanceGroup) => {
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
    setSDInstanceGroupsPageData(sdInstanceGroupsPageData)
  }, [data])
  return <SDInstanceGroupsPageView sdInstanceGroupsPageData={sdInstanceGroupsPageData} anyLoadingOccurs={loading} anyErrorOccurred={!!error} />
}

export default SDInstanceGroupsPageController
