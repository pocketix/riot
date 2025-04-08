import {
  SdInstanceGroupsWithKpiDataQuery,
  SdInstancesWithTypeAndSnapshotQuery,
  useSdInstanceGroupsWithKpiDataQuery
} from '@/generated/graphql'
import { useMemo } from 'react'
import { GroupsView } from './GroupsView'
import { useKpiContext } from '@/context/KPIContext'
import { GroupDetailWithKPIs } from '@/controllers/details/GroupDetailPageController'
import { getGroupKPIStats } from './utils/getGroupKPIStats'

type KPIDefinition = SdInstanceGroupsWithKpiDataQuery['kpiDefinitions'][0]

export interface KPIDefinitionWithFulfillment extends KPIDefinition {
  fulfilled: boolean | null
}

export type KPIGroup = {
  groupID: number
  userIdentifier: string
  instances: SdInstancesWithTypeAndSnapshotQuery['sdInstances']
  KPIDefinitionsWithFulfillment: KPIDefinitionWithFulfillment[]
}

export const DashboardGroupCardsController = () => {
  const { data: fetchedGroupData } = useSdInstanceGroupsWithKpiDataQuery()
  const { instancesWithKPIs: instances } = useKpiContext()

  const groups: GroupDetailWithKPIs[] = useMemo(() => {
    if (!fetchedGroupData || !instances.length) return []

    const { sdInstanceGroups } = fetchedGroupData

    return sdInstanceGroups.map((group) => getGroupKPIStats(group, instances))
  }, [fetchedGroupData, instances])

  return <GroupsView groups={groups} />
}
