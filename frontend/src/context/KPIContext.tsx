import { createContext, useContext, ReactNode, useState, useEffect, useMemo, useRef } from 'react'
import {
  KpiDefinitionsAndResultsQuery,
  KpiFulfillmentSubscription,
  useKpiDefinitionsAndResultsQuery,
  useKpiFulfillmentSubscription
} from '@/generated/graphql'
import { useInstances } from '@/context/InstancesContext'
import { InstanceWithKPIs, KPIdata, KPIStats, kpiStore } from './stores/kpiStore'

interface KpiContextState {
  kpiFulfillment: Record<number, KPIdata[]>
  kpiDefinitions: any[]

  kpiLoading: boolean
  kpiError?: any

  instancesWithKPIs: InstanceWithKPIs[]

  getInstanceKPIs: (instanceId: number) => KPIdata[]
  getFulfilledKPIs: (instanceId: number) => KPIdata[]
  getNotFulfilledKPIs: (instanceId: number) => KPIdata[]
  getInstanceKPIStats: (instanceId: number) => KPIStats
  getInstanceWithKPIs: (uid?: string, id?: number) => InstanceWithKPIs | null
}

type KPIResult = KpiFulfillmentSubscription['onKPIFulfillmentChecked']['kpiFulfillmentCheckResults'][0]

const KpiContext = createContext<KpiContextState | undefined>(undefined)

export function KpiProvider({ children }: { children: ReactNode }) {
  const { data: kpiData, loading: kpiLoading, error: kpiError } = useKpiDefinitionsAndResultsQuery()
  const { instances, getInstanceById, getInstanceByUid } = useInstances()
  const [kpiFulfillment, setKpiFulfillment] = useState<Record<number, KPIdata[]>>({})
  const updatedInstancesRef = useRef(new Set<number>())
  const activeSubscribersRef = useRef(new Set<number>())

  // Initial KPI data from query
  useEffect(() => {
    if (!kpiData?.kpiFulfillmentCheckResults || !kpiData.kpiDefinitions || instances.length === 0) return

    const initialKpiFulfillment: Record<number, KPIdata[]> = {}

    kpiData.kpiFulfillmentCheckResults.forEach((result) => {
      const instanceId = result.sdInstanceID
      if (!initialKpiFulfillment[instanceId]) {
        initialKpiFulfillment[instanceId] = []
      }

      const kpiDefinition = kpiData.kpiDefinitions.find((def) => def.id === result.kpiDefinitionID)
      if (!kpiDefinition) return

      initialKpiFulfillment[instanceId].push({
        id: kpiDefinition.id,
        userIdentifier: kpiDefinition.userIdentifier,
        fulfilled: result.fulfilled as boolean | null
      })
    })

    Object.keys(initialKpiFulfillment).forEach((instanceIdStr) => {
      const instanceId = parseInt(instanceIdStr)
      initialKpiFulfillment[instanceId] = sortKPIs(initialKpiFulfillment[instanceId])
    })

    setKpiFulfillment(initialKpiFulfillment)
  }, [kpiData, instances])

  useKpiFulfillmentSubscription({
    ignoreResults: true, // prevents re-rendering on every update
    onData: ({ data }) => {
      if (!data?.data?.onKPIFulfillmentChecked || !kpiData?.kpiDefinitions) return

      // Group results by instance ID
      const updatesByInstance = data.data.onKPIFulfillmentChecked.kpiFulfillmentCheckResults.reduce(
        (acc, result) => {
          const instanceId = result.sdInstanceID
          if (!acc[instanceId]) acc[instanceId] = []
          acc[instanceId].push(result as KPIResult)
          return acc
        },
        {} as Record<number, KPIResult[]>
      )

      const instanceIds = Object.keys(updatesByInstance).map(Number)

      // Filter to instances we care about
      const relevantInstanceIds = instanceIds.filter(
        (id) => activeSubscribersRef.current.has(id) || instanceIds.length === 1
      )

      if (relevantInstanceIds.length === 0) return

      updatedInstancesRef.current = new Set<number>()

      setKpiFulfillment((prev) => {
        const updated = { ...prev }
        let hasChanges = false

        relevantInstanceIds.forEach((instanceId) => {
          const updates = updatesByInstance[instanceId]
          if (!updates?.length) return

          if (!updated[instanceId]) updated[instanceId] = []

          const processedUpdates = processInstanceUpdates(updated[instanceId], updates, kpiData.kpiDefinitions)

          if (processedUpdates.changed) {
            updated[instanceId] = sortKPIs(processedUpdates.kpis)
            updatedInstancesRef.current.add(instanceId)
            hasChanges = true
          }
        })

        return hasChanges ? updated : prev
      })
    }
  })

  const processInstanceUpdates = (
    existingKpis: KPIdata[],
    updates: KPIResult[],
    definitions: KpiDefinitionsAndResultsQuery['kpiDefinitions']
  ) => {
    let changed = false
    const kpis = [...existingKpis]

    updates.forEach((result) => {
      const kpiDefinition = definitions.find((def) => def.id === result.kpiDefinitionID)
      if (!kpiDefinition) return

      const existingIndex = kpis.findIndex((kpi) => kpi.id === result.kpiDefinitionID)

      if (existingIndex >= 0) {
        if (kpis[existingIndex].fulfilled !== result.fulfilled) {
          kpis[existingIndex] = {
            ...kpis[existingIndex],
            fulfilled: result.fulfilled
          }
          changed = true
        }
      } else {
        kpis.push({
          id: kpiDefinition.id,
          userIdentifier: kpiDefinition.userIdentifier,
          fulfilled: result.fulfilled || null
        })
        changed = true
      }
    })

    return { kpis, changed }
  }

  useEffect(() => {
    if (updatedInstancesRef.current.size === 0) return

    updatedInstancesRef.current.forEach((instanceId) => {
      const instance = getInstanceById(instanceId)
      if (!instance) return

      const kpis = kpiFulfillment[instanceId] || []
      const kpiStats = getInstanceKPIStats(instanceId)

      kpiStore.setInstance({ ...instance, kpis, kpiStats }, instance.uid, instance.id)
    })

    updatedInstancesRef.current.clear()
  }, [kpiFulfillment, instances])

  const sortKPIs = (kpis: KPIdata[]) => {
    return [...kpis].sort((a, b) => {
      const sortValue = (fulfilled: boolean | null): number => {
        if (fulfilled === false) return 0
        if (fulfilled === null) return 1
        return 2
      }

      const sortValueA = sortValue(a.fulfilled)
      const sortValueB = sortValue(b.fulfilled)

      if (sortValueA !== sortValueB) {
        return sortValueA - sortValueB
      }

      // equal - sort by userIdentifier
      return a.userIdentifier.localeCompare(b.userIdentifier)
    })
  }

  // Utility functions
  const getInstanceKPIs = (instanceId: number): KPIdata[] => {
    return kpiFulfillment[instanceId] || []
  }

  const getFulfilledKPIs = (instanceId: number): KPIdata[] => {
    return (kpiFulfillment[instanceId] || []).filter((kpi) => kpi.fulfilled === true)
  }

  const getNotFulfilledKPIs = (instanceId: number): KPIdata[] => {
    return (kpiFulfillment[instanceId] || []).filter((kpi) => kpi.fulfilled === false)
  }

  const getInstanceKPIStats = (instanceId: number): KPIStats => {
    const kpis = kpiFulfillment[instanceId] || []
    const total = kpis.length
    const fulfilled = kpis.filter((kpi) => kpi.fulfilled === true).length
    const notFulfilled = kpis.filter((kpi) => kpi.fulfilled === false).length
    const fulfillmentPercentage = total > 0 ? Math.round((fulfilled / total) * 100) : 0

    return {
      fulfilled,
      notFulfilled,
      total,
      fulfillmentPercentage
    }
  }

  const instancesWithKPIs = useMemo(() => {
    const withKPIs = instances.map((instance) => {
      const kpis = getInstanceKPIs(instance.id)
      const kpiStats = getInstanceKPIStats(instance.id)

      const instanceWithKPIs = {
        ...instance,
        kpis,
        kpiStats
      }

      // Update the store's instance state
      kpiStore.setInstance(instanceWithKPIs, instance.uid, instance.id)
      return instanceWithKPIs
    })

    return withKPIs
  }, [instances, kpiFulfillment])

  // Utility function to get an exact instance with KPIs
  const getInstanceWithKPIs = (uid?: string, id?: number): InstanceWithKPIs | null => {
    if (!uid && !id) return null

    let instance
    if (uid) {
      instance = getInstanceByUid(uid)
    } else if (id) {
      instance = getInstanceById(id)
    }

    if (!instance) return null

    // Subscribe to updates for this instance
    activeSubscribersRef.current.add(instance.id)

    const kpis = getInstanceKPIs(instance.id)
    const kpiStats = getInstanceKPIStats(instance.id)

    const instanceWithKPIs = {
      ...instance,
      kpis,
      kpiStats
    }

    // Update the store's instance state
    kpiStore.setInstance(instanceWithKPIs, uid, id)

    return instanceWithKPIs
  }

  const contextValue = {
    kpiFulfillment,
    kpiDefinitions: kpiData?.kpiDefinitions || [],
    kpiLoading,
    kpiError,
    instancesWithKPIs,
    getInstanceKPIs,
    getFulfilledKPIs,
    getNotFulfilledKPIs,
    getInstanceKPIStats,
    getInstanceWithKPIs
  }

  return <KpiContext.Provider value={contextValue}>{children}</KpiContext.Provider>
}

export function useKpiContext() {
  const context = useContext(KpiContext)
  if (context === undefined) {
    throw new Error('useKpiContext must be used within a KpiProvider')
  }
  return context
}
