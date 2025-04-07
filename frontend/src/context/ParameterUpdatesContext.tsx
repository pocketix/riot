import { createContext, useState, useCallback, ReactNode } from 'react'
import { useOnSdParameterSnapshotUpdateSubscription } from '@/generated/graphql'
import { useInstances } from '@/context/InstancesContext'
import { instanceUpdatesStore } from './utils/lastUpdatedStore'

interface ParameterUpdatesContextType {
  initializeInstance: (instanceId: number) => void
  getLastUpdateForInstance: (instanceId: number) => string | null
}

export const ParameterUpdatesContext = createContext<ParameterUpdatesContextType>({
  initializeInstance: () => {},
  getLastUpdateForInstance: () => null
})

interface ParameterUpdatesProviderProps {
  children: ReactNode
}

export function ParameterUpdatesProvider({ children }: ParameterUpdatesProviderProps) {
  const [initialized, setInitialized] = useState<Record<number, boolean>>({})
  const { instances, getInstanceById } = useInstances()

  // Initialize from stored snapshots which are included in the instance data
  const initializeInstance = useCallback(
    (instanceId: number) => {
      if (initialized[instanceId]) return

      const instance = getInstanceById(instanceId)
      if (!instance?.parameterSnapshots?.length) return

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

  const getLastUpdateForInstance = useCallback((instanceId: number): string | null => {
    return instanceUpdatesStore.getTimestamp(instanceId)
  }, [])

  useOnSdParameterSnapshotUpdateSubscription({
    ignoreResults: true, // prevents re-renders on new data
    onData: ({ data }) => {
      if (!data?.data?.onSDParameterSnapshotUpdate) return

      const update = data.data.onSDParameterSnapshotUpdate

      if (!update.instanceId || !update.updatedAt) return

      // update the store for the specific instance
      instanceUpdatesStore.setTimestamp(update.instanceId, update.updatedAt)
    }
  })

  const contextValue = {
    initializeInstance,
    getLastUpdateForInstance
  }

  return <ParameterUpdatesContext.Provider value={contextValue}>{children}</ParameterUpdatesContext.Provider>
}
