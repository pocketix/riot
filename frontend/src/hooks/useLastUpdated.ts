import { useParameterSnapshotContext } from '@/context/ParameterUpdatesContext'
import { instanceUpdatesStore } from '@/context/stores/lastUpdatedStore'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { formatDistanceToNow } from 'date-fns'

function useInstanceLastUpdated(instanceId: number): string | null {
  const { initializeInstance } = useParameterSnapshotContext()

  useEffect(() => {
    initializeInstance(instanceId)
  }, [instanceId, initializeInstance])

  return useSyncExternalStore(
    (callback) => instanceUpdatesStore.subscribe(instanceId, callback),
    () => instanceUpdatesStore.getTimestamp(instanceId)
  )
}

export function useFormattedLastUpdated(
  instanceId: number,
  options: {
    refreshInterval?: number
    defaultValue?: string
    addSuffix?: boolean
  } = {}
): string {
  const { refreshInterval = 60 * 1000, defaultValue = 'Never', addSuffix = true } = options

  const timestamp = useInstanceLastUpdated(instanceId)
  const [formattedTime, setFormattedTime] = useState<string>(defaultValue)

  const updateFormattedTime = () => {
    if (!timestamp) {
      setFormattedTime(defaultValue)
      return
    }

    try {
      setFormattedTime(formatDistanceToNow(new Date(timestamp), { addSuffix }))
    } catch (err) {
      console.error('Error formatting timestamp:', err)
      setFormattedTime('Unknown')
    }
  }

  useEffect(() => {
    updateFormattedTime()

    const intervalId = setInterval(updateFormattedTime, refreshInterval)
    return () => clearInterval(intervalId)
  }, [timestamp, refreshInterval])

  return formattedTime
}
