import { isEqual } from 'lodash'
import { Instance } from '../InstancesContext'

export interface KPIdata {
  id: number
  userIdentifier: string
  fulfilled: boolean | null
}

export interface KPIStats {
  fulfilled: number
  notFulfilled: number
  total: number
  fulfillmentPercentage: number
}

export interface InstanceWithKPIs extends Instance {
  kpis: KPIdata[]
  kpiStats: KPIStats
}

// workaround as the backend does not provide a subscription for individual instances
// without the store and its usage within useSyncExternalStore,
// the UI would update on each instance update in some cases
class InstanceKPIStore {
  private instanceData: Record<string, InstanceWithKPIs> = {}
  private listeners: Map<string, Set<() => void>> = new Map()

  getInstanceKey(uid?: string, id?: number): string {
    return uid ? `uid:${uid}` : id ? `id:${id}` : 'none'
  }

  // Set instance data
  setInstance(instance: InstanceWithKPIs | null, uid?: string, id?: number): boolean {
    if (!instance) return false

    const key = this.getInstanceKey(uid, id)
    const currentData = this.instanceData[key]

    // Deep compare KPIs to avoid unnecessary updates
    // TODO: Check if lodash equal is enough
    const kpisChanged = isEqual(currentData?.kpis, instance.kpis)

    if (kpisChanged) {
      this.instanceData[key] = { ...instance }
      this.notifyListeners(key)
      return true
    }

    return false
  }

  getInstance(uid?: string, id?: number): InstanceWithKPIs | null {
    const key = this.getInstanceKey(uid, id)
    return this.instanceData[key] || null
  }

  subscribe(uid: string | undefined, id: number | undefined, listener: () => void): () => void {
    const key = this.getInstanceKey(uid, id)

    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }

    this.listeners.get(key)?.add(listener)

    return () => {
      this.listeners.get(key)?.delete(listener)
      if (this.listeners.get(key)?.size === 0) {
        this.listeners.delete(key)
      }
    }
  }

  private notifyListeners(key: string): void {
    this.listeners.get(key)?.forEach((listener) => listener())
  }
}

// Singleton store for the whole context
export const kpiStore = new InstanceKPIStore()
