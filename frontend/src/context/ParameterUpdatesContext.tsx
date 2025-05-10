import { createContext, useState, useCallback, ReactNode, useContext } from 'react'
import {
  OnSdParameterSnapshotUpdateSubscription,
  useOnSdParameterSnapshotUpdateSubscription
} from '@/generated/graphql'
import { useInstances } from '@/context/InstancesContext'
import { parameterSnapshotStore } from './stores/parameterSnapshotStore'
import { instanceUpdatesStore } from './stores/lastUpdatedStore'

type ParameterSnapshot = OnSdParameterSnapshotUpdateSubscription['onSDParameterSnapshotUpdate']

interface ParameterSnapshotContextType {
  initializeInstance: (instanceId: number) => void
  getParameterSnapshot: (instanceId: number, parameterId: number) => ParameterSnapshot | null
  getInstanceSnapshots: (instanceId: number) => Record<number, ParameterSnapshot>
  getLastUpdateForInstance: (instanceId: number) => string | null
}

export const ParameterSnapshotContext = createContext<ParameterSnapshotContextType>({
  initializeInstance: () => {},
  getParameterSnapshot: () => null,
  getInstanceSnapshots: () => ({}),
  getLastUpdateForInstance: () => null
})

interface ParameterSnapshotProviderProps {
  children: ReactNode
}

export function ParameterSnapshotProvider({ children }: ParameterSnapshotProviderProps) {
  const [initialized, setInitialized] = useState<Record<number, boolean>>({})
  const { instances, getInstanceById } = useInstances()

  // Initialize from stored snapshots which are included in the instance data
  // The data may not be up-to-date as snapshot data does not update in useInstances
  const initializeInstance = useCallback(
    (instanceId: number) => {
      if (initialized[instanceId]) return

      const instance = getInstanceById(instanceId)
      if (!instance?.parameterSnapshots?.length) return

      parameterSnapshotStore.setSnapshots(instanceId, instance.parameterSnapshots)
      const mostRecentSnapshot = [...instance.parameterSnapshots].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0]

      if (mostRecentSnapshot?.updatedAt) {
        instanceUpdatesStore.setTimestamp(instanceId, mostRecentSnapshot.updatedAt as string)
      }
      setInitialized((prev) => ({ ...prev, [instanceId]: true }))
    },
    [instances, initialized]
  )

  const getParameterSnapshot = useCallback((instanceId: number, parameterId: number): ParameterSnapshot | null => {
    initializeInstance(instanceId)
    return parameterSnapshotStore.getSnapshot(instanceId, parameterId)
  }, [])

  const getInstanceSnapshots = useCallback((instanceId: number): Record<number, ParameterSnapshot> => {
    initializeInstance(instanceId)
    return parameterSnapshotStore.getInstanceSnapshots(instanceId)
  }, [])

  const getLastUpdateForInstance = useCallback((instanceId: number): string | null => {
    initializeInstance(instanceId)
    return instanceUpdatesStore.getTimestamp(instanceId)
  }, [])

  useOnSdParameterSnapshotUpdateSubscription({
    ignoreResults: true, // prevents re-renders on new data
    onData: ({ data }) => {
      if (!data?.data?.onSDParameterSnapshotUpdate) return

      const update = data.data.onSDParameterSnapshotUpdate
      parameterSnapshotStore.setSnapshot(update)
      instanceUpdatesStore.setTimestamp(update.instanceId, update.updatedAt)
    }
  })

  const contextValue = {
    initializeInstance,
    getParameterSnapshot,
    getInstanceSnapshots,
    getLastUpdateForInstance
  }

  return <ParameterSnapshotContext.Provider value={contextValue}>{children}</ParameterSnapshotContext.Provider>
}

export function useParameterSnapshotContext() {
  const context = useContext(ParameterSnapshotContext)
  if (!context) {
    throw new Error('useParameterSnapshotContext must be used within a ParameterSnapshotProvider')
  }
  return context
}
