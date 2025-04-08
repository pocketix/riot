import { useEffect, useMemo, useState } from 'react'
import { useSdInstanceGroupsWithKpiDataQuery } from '@/generated/graphql'
import { GroupPageView } from '@/views/GroupPageView'
import { InstanceWithKPIs } from '@/context/stores/kpiStore'
import { useKpiContext } from '@/context/KPIContext'

export interface WholeKPIGroupDetails {
  groupID: number
  userIdentifier: string
  instances: InstanceWithKPIs[]
  kpiStats: {
    total: number
    fulfilled: number
    notFulfilled: number
    fulfillmentPercentage: number
  }
}

export const GroupPageController = () => {
  const { instancesWithKPIs: instances, kpiLoading: instancesLoading } = useKpiContext()
  const { data: groupsData, loading: groupsLoading } = useSdInstanceGroupsWithKpiDataQuery()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'kpis' | 'name' | 'size'>('kpis')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const initialKpiGroups: WholeKPIGroupDetails[] = useMemo(() => {
    if (!groupsData || !instances.length) return []

    const { sdInstanceGroups } = groupsData // TODO: use a separete query for this

    return sdInstanceGroups.map((group) => {
      const groupInstances = group.sdInstanceIDs
        .map((id) => {
          const instance = instances.find((instance) => instance.id === id)
          return instance || null
        })
        .filter(Boolean) as InstanceWithKPIs[]

      const kpiStats = groupInstances.reduce(
        (acc, instance) => {
          const kpiCount = instance.kpis.length
          const fulfilledCount = instance.kpiStats.fulfilled
          const notFulfilledCount = instance.kpiStats.notFulfilled
          acc.total += kpiCount
          acc.fulfilled += fulfilledCount
          acc.notFulfilled += notFulfilledCount
          return acc
        },
        { total: 0, fulfilled: 0, notFulfilled: 0 }
      )

      console.log('KPI stats in controller', kpiStats)

      return {
        groupID: group.id,
        userIdentifier: group.userIdentifier,
        instances: groupInstances,
        kpiStats: {
          total: kpiStats.total,
          fulfilled: kpiStats.fulfilled,
          notFulfilled: kpiStats.notFulfilled,
          fulfillmentPercentage: kpiStats.total > 0 ? Math.round((kpiStats.fulfilled / kpiStats.total) * 100) : 100
        }
      }
    })
  }, [groupsData, instances])

  const [kpiGroups, setKpiGroups] = useState<WholeKPIGroupDetails[]>([])

  useEffect(() => {
    if (initialKpiGroups.length > 0) {
      setKpiGroups(initialKpiGroups)
    }
  }, [initialKpiGroups])

  const groupsWithStats: WholeKPIGroupDetails[] = useMemo(() => {
    return kpiGroups.map((group) => {
      const totalKPIs = group.instances.reduce((acc, instance) => {
        const kpiCount = instance.kpis.length
        return acc + kpiCount
      }, 0)
      const fulfilledKPIs = group.instances.reduce((acc, instance) => {
        const fulfilledCount = instance.kpiStats.fulfilled
        return acc + fulfilledCount
      }, 0)
      const notFulfilledKPIs = group.instances.reduce((acc, instance) => {
        const notFulfilledCount = instance.kpiStats.notFulfilled
        return acc + notFulfilledCount
      }, 0)
      const fulfillmentPercentage = totalKPIs > 0 ? Math.round((fulfilledKPIs / totalKPIs) * 100) : 100

      return {
        ...group,
        instanceCount: group.instances.length,
        instances: group.instances,
        kpiStats: {
          total: totalKPIs,
          fulfilled: fulfilledKPIs,
          notFulfilled: notFulfilledKPIs,
          fulfillmentPercentage
        }
      }
    })
  }, [kpiGroups])

  // Filtering and sorting based on search
  const processedGroups = useMemo(() => {
    if (!groupsWithStats.length) return []

    let filtered = groupsWithStats
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = groupsWithStats.filter(
        (group) =>
          group.userIdentifier.toLowerCase().includes(query) ||
          group.instances.some((inst) => inst.userIdentifier.toLowerCase().includes(query))
      )
    }

    return [...filtered].sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'kpis':
          comparison =
            a.kpiStats.notFulfilled !== b.kpiStats.notFulfilled
              ? a.kpiStats.notFulfilled - b.kpiStats.notFulfilled
              : b.kpiStats.fulfillmentPercentage - a.kpiStats.fulfillmentPercentage
          break
        case 'name':
          comparison = a.userIdentifier.localeCompare(b.userIdentifier)
          break
        case 'size':
          comparison = a.instances.length - b.instances.length
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [groupsWithStats, searchQuery, sortBy, sortDirection])

  const isLoading = instancesLoading || groupsLoading

  return (
    <GroupPageView
      groups={processedGroups}
      isLoading={isLoading}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      sortBy={sortBy}
      setSortBy={setSortBy}
      sortDirection={sortDirection}
      setSortDirection={setSortDirection}
    />
  )
}
