import { useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useSdInstanceGroupsWithKpiDataQuery } from '@/generated/graphql'
import { GroupDetailPageView } from '@/views/GroupDetailPageView'
import { InstanceWithKPIs, KPIStats } from '@/context/utils/kpiStore'
import { useKpiContext } from '@/context/KPIContext'
import { getGroupKPIStats } from '@/features/dashboard/components/groups/utils/getGroupKPIStats'

export interface GroupDetailWithKPIs {
  groupID: number
  userIdentifier: string
  instances: InstanceWithKPIs[]
  kpiStats: KPIStats
}

export const GroupDetailPageController = () => {
  const { id } = useParams<{ id: string }>()
  const groupId = id ? parseInt(id) : -1

  const { data: fetchedGroupData, loading: groupsLoading } = useSdInstanceGroupsWithKpiDataQuery()
  const { instancesWithKPIs, kpiLoading: instancesLoading } = useKpiContext()

  const initialGroupData = useMemo(() => {
    if (!fetchedGroupData || !instancesWithKPIs.length || !groupId) return null

    const { sdInstanceGroups } = fetchedGroupData
    const group = sdInstanceGroups.find((g) => g.id === groupId)

    if (!group) return null

    return getGroupKPIStats(group, instancesWithKPIs)
  }, [fetchedGroupData, instancesWithKPIs, groupId])

  const [groupData, setGroupData] = useState<GroupDetailWithKPIs | null>(null)

  useEffect(() => {
    if (initialGroupData) {
      setGroupData(initialGroupData)
    }
  }, [initialGroupData])

  const isLoading = instancesLoading || groupsLoading || !groupData

  return isLoading ? (
    <div className="flex h-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
    </div>
  ) : (
    <GroupDetailPageView groupData={groupData!} />
  )
}
