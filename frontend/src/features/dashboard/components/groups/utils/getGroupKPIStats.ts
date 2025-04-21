import { InstanceWithKPIs } from '@/context/stores/kpiStore'
import { GroupDetailWithKPIs } from '@/controllers/details/GroupDetailPageController'
import { SdInstanceGroupsWithKpiDataQuery } from '@/generated/graphql'

export function getGroupKPIStats(
  group: SdInstanceGroupsWithKpiDataQuery['sdInstanceGroups'][0],
  instancesWithKPIs: InstanceWithKPIs[]
): GroupDetailWithKPIs {
  const groupInstances = group.sdInstanceIDs
    .map((id) => instancesWithKPIs.find((instance) => instance.id === id))
    .filter(Boolean) as InstanceWithKPIs[]

  const totalKPIs = groupInstances.reduce((acc, instance) => {
    return acc + instance.kpiStats.total
  }, 0)
  const fulfilledKPIs = groupInstances.reduce((acc, instance) => {
    return acc + instance.kpiStats.fulfilled
  }, 0)
  const notFulfilledKPIs = groupInstances.reduce((acc, instance) => {
    return acc + instance.kpiStats.notFulfilled
  }, 0)
  const fulfillmentPercentage = totalKPIs > 0 ? Math.round((fulfilledKPIs / totalKPIs) * 100) : 100

  const sortedInstances = groupInstances.sort((a, b) => {
    const aKPIStats = a.kpiStats
    const bKPIStats = b.kpiStats
    if (aKPIStats.notFulfilled !== bKPIStats.notFulfilled) {
      return bKPIStats.notFulfilled - aKPIStats.notFulfilled
    }
    return a.userIdentifier.localeCompare(b.userIdentifier)
  })

  return {
    groupID: group.id,
    userIdentifier: group.userIdentifier,
    instances: sortedInstances,
    kpiStats: {
      total: totalKPIs,
      fulfilled: fulfilledKPIs,
      notFulfilled: notFulfilledKPIs,
      fulfillmentPercentage
    }
  }
}
