import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { parameterSnapshotStore } from '@/context/stores/parameterSnapshotStore'
import { useParameterSnapshotContext } from '@/context/ParameterUpdatesContext'

export interface ParameterSnapshotHookResult {
  value: string | number | boolean | null
  lastUpdated: string | null
  valueType: 'string' | 'number' | 'boolean' | 'unknown'
}

export function useParameterSnapshot(instanceId: number, parameterId: number): ParameterSnapshotHookResult {
  const { initializeInstance } = useParameterSnapshotContext()

  // Initialize the instance, load the last snapshot data
  useEffect(() => {
    initializeInstance(instanceId)
  }, [instanceId, initializeInstance])

  // Subscribe to changes and get the current last snapshot data
  const snapshot = useSyncExternalStore(
    (callback) => parameterSnapshotStore.subscribe(instanceId, parameterId, callback),
    () => parameterSnapshotStore.getSnapshot(instanceId, parameterId)
  )

  // Parse the value and type so that we can use jsut .value instead of .string, .number, .boolean in the UI
  const { value, valueType } = useMemo(() => {
    if (!snapshot) return { value: null, valueType: 'unknown' as const }

    if (snapshot.boolean !== null && snapshot.boolean !== undefined) {
      return { value: snapshot.boolean, valueType: 'boolean' as const }
    }
    if (snapshot.number !== null && snapshot.number !== undefined) {
      return { value: snapshot.number, valueType: 'number' as const }
    }
    if (snapshot.string !== null && snapshot.string !== undefined) {
      return { value: snapshot.string, valueType: 'string' as const }
    }
    return { value: null, valueType: 'unknown' as const }
  }, [snapshot])

  return {
    value,
    valueType,
    lastUpdated: snapshot?.updatedAt || null
  }
}
