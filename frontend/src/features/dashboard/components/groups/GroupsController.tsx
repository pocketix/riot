import {
  SdInstanceGroupsWithKpiDataQuery,
  SdInstancesWithTypeAndSnapshotQuery,
  useKpiFulfillmentSubscription,
  useSdInstanceGroupsWithKpiDataQuery
} from '@/generated/graphql'
import { useEffect, useMemo, useState } from 'react'
import { GroupsView } from './GroupsView'

interface GroupsControllerProps {
  instances: SdInstancesWithTypeAndSnapshotQuery['sdInstances']
}

export type KPIGroup = {
  groupID: number
  userIdentifier: string
  instances: SdInstancesWithTypeAndSnapshotQuery['sdInstances']
  KPIdefinitions: SdInstanceGroupsWithKpiDataQuery['kpiDefinitions']
  KPIfulfillments: SdInstanceGroupsWithKpiDataQuery['kpiFulfillmentCheckResults']
}

export const GroupsController = ({ instances }: GroupsControllerProps) => {
  const { data: fetchedGroupData } = useSdInstanceGroupsWithKpiDataQuery()
  const { data: KPIFullfillmentCheckedData } = useKpiFulfillmentSubscription()

  const initialKpiGroups: KPIGroup[] = useMemo(() => {
    if (!fetchedGroupData || !instances.length) return []

    const { sdInstanceGroups, kpiDefinitions, kpiFulfillmentCheckResults } = fetchedGroupData

    return sdInstanceGroups.map((group) => {
      const groupInstances = group.sdInstanceIDs
        .map((id) => instances.find((instance) => instance.id === id))
        .filter(Boolean) as SdInstancesWithTypeAndSnapshotQuery['sdInstances']

      const groupKpiDefinitions = kpiDefinitions.filter((kpi) => {
        if (kpi.sdInstanceMode === 'ALL') {
          return groupInstances.some((instance) => instance.type.id === kpi.sdTypeID)
        } else if (kpi.sdInstanceMode === 'SELECTED') {
          return kpi.selectedSDInstanceUIDs.some((id) => groupInstances.some((instance) => instance.uid === id))
        }
        return false
      })

      const groupKpiFulfillments = kpiFulfillmentCheckResults.filter(
        (result) =>
          group.sdInstanceIDs.includes(result.sdInstanceID) &&
          groupKpiDefinitions.some((kpi) => kpi.id === result.kpiDefinitionID)
      )

      return {
        groupID: group.id,
        userIdentifier: group.userIdentifier,
        instances: groupInstances,
        KPIdefinitions: groupKpiDefinitions,
        KPIfulfillments: groupKpiFulfillments
      }
    })
  }, [fetchedGroupData, instances])

  const [kpiGroups, setKpiGroups] = useState<KPIGroup[]>([])

  useEffect(() => {
    if (initialKpiGroups.length > 0) {
      setKpiGroups(initialKpiGroups)
    }
  }, [initialKpiGroups])

  useEffect(() => {
    if (KPIFullfillmentCheckedData) {
      // console.log('KPI fulfillment checked:', KPIFullfillmentCheckedData) // TODO: Remove

      setKpiGroups((currentGroups) => {
        return currentGroups.map((group) => {
          const hasUpdates = KPIFullfillmentCheckedData.onKPIFulfillmentChecked.kpiFulfillmentCheckResults.some(
            (result) => group.instances.some((instance) => instance.id === result.sdInstanceID)
          )

          if (!hasUpdates) return group

          return {
            ...group,
            KPIfulfillments: group.KPIfulfillments.map((fulfillment) => {
              const update = KPIFullfillmentCheckedData.onKPIFulfillmentChecked.kpiFulfillmentCheckResults.find(
                (result) =>
                  result.kpiDefinitionID === fulfillment.kpiDefinitionID &&
                  group.instances.some((instance) => instance.id === result.sdInstanceID)
              )

              if (update) {
                return {
                  ...fulfillment,
                  fulfilled: update.fulfilled
                }
              }

              return fulfillment
            })
          }
        })
      })
    }
  }, [KPIFullfillmentCheckedData])

  return <GroupsView groups={kpiGroups} />
}
