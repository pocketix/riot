import { useMemo, useSyncExternalStore } from 'react'
import { useKpiContext } from '../context/KPIContext'
import { useInstances } from '../context/InstancesContext'
import { kpiStore } from '../context/stores/kpiStore'

export function useInstanceWithKPIs(instanceUID?: string, instanceID?: number) {
  const { getInstanceWithKPIs, kpiLoading, kpiError } = useKpiContext()
  const { getInstanceGroups } = useInstances()

  const instanceWithKPIs = useMemo(() => {
    const instance = getInstanceWithKPIs(instanceUID, instanceID)
    return instance
  }, [instanceUID, instanceID, getInstanceWithKPIs])

  const instance = useSyncExternalStore(
    (callback) => kpiStore.subscribe(instanceUID, instanceID, callback),
    () => instanceWithKPIs || kpiStore.getInstance(instanceUID, instanceID)
  )

  const groups = useMemo(() => {
    if (!instance) return []
    return getInstanceGroups(instance.id)
  }, [instance, getInstanceGroups])

  const kpis = useMemo(() => {
    if (!instance) return []
    return instance.kpis
  }, [instance])

  return {
    instance,
    kpis,
    kpiStats: instance?.kpiStats || { fulfilled: 0, notFulfilled: 0, total: 0, fulfillmentPercentage: 0 },
    groups,
    isLoading: kpiLoading,
    error: kpiError
  }
}
