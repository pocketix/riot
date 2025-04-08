export class InstanceUpdatesStore {
  private updates: Record<number, string> = {}
  private listeners: Map<number, Set<() => void>> = new Map()

  getTimestamp(instanceId: number): string | null {
    return this.updates[instanceId] || null
  }

  setTimestamp(instanceId: number, timestamp: string): boolean {
    const currentTimestamp = this.updates[instanceId]

    if (!currentTimestamp || new Date(timestamp) > new Date(currentTimestamp)) {
      this.updates[instanceId] = timestamp
      this.notifyListeners(instanceId)
      return true
    }

    return false
  }

  subscribe(instanceId: number, listener: () => void): () => void {
    if (!this.listeners.has(instanceId)) {
      this.listeners.set(instanceId, new Set())
    }

    this.listeners.get(instanceId)?.add(listener)

    return () => {
      this.listeners.get(instanceId)?.delete(listener)
      if (this.listeners.get(instanceId)?.size === 0) {
        this.listeners.delete(instanceId)
      }
    }
  }

  private notifyListeners(instanceId: number): void {
    this.listeners.get(instanceId)?.forEach((listener) => listener())
  }
}

// single store used in context and hooks
export const instanceUpdatesStore = new InstanceUpdatesStore()
