import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useSdInstanceGroupsWithKpiDataQuery } from '@/generated/graphql'
import { GroupDetailPageView } from '@/pages/views/GroupDetailPageView'
import { InstanceWithKPIs, KPIStats } from '@/context/stores/kpiStore'
import { useKpiContext } from '@/context/KPIContext'
import { getGroupKPIStats } from '@/features/dashboard/components/groups/utils/getGroupKPIStats'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft } from 'lucide-react'

export interface GroupDetailWithKPIs {
  groupID: number
  userIdentifier: string
  instances: InstanceWithKPIs[]
  kpiStats: KPIStats
}

export const GroupDetailPageController = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const groupId = id ? parseInt(id) : -1

  const { data: fetchedGroupData, loading: groupsLoading, error: groupsError } = useSdInstanceGroupsWithKpiDataQuery()
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

  const isLoading = instancesLoading || groupsLoading

  if ((!isLoading && !groupData) || groupsError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <p className="text-center text-lg text-muted-foreground">Group not found.</p>
        <Button
          onClick={() => {
            navigate('/groups')
          }}
          className="flex items-center gap-2"
        >
          <ArrowLeft />
          Go back to groups
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="mx-4 mt-5 flex h-screen flex-col items-start overflow-hidden">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="mt-4 h-20 w-full" />
        <Skeleton className="mt-4 h-6 w-1/4" />
        <div className="flex h-fit w-full flex-wrap items-center justify-center gap-2">
          <Skeleton className="mt-4 h-32 w-1/3" />
          <Skeleton className="mt-4 h-32 w-1/4" />
          <Skeleton className="mt-4 h-32 w-1/3" />
          <Skeleton className="mt-4 h-32 w-1/3" />
          <Skeleton className="mt-4 h-32 w-1/4" />
          <Skeleton className="mt-4 h-32 w-1/3" />
        </div>
      </div>
    )
  }

  return <GroupDetailPageView groupData={groupData!} />
}
