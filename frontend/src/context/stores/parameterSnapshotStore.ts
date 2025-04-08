import { OnSdParameterSnapshotUpdateSubscription } from '@/generated/graphql'

type ParameterSnapshot = OnSdParameterSnapshotUpdateSubscription['onSDParameterSnapshotUpdate']

export class ParameterSnapshotStore {
  private snapshots: Record<number, Record<number, ParameterSnapshot>> = {}
  private listeners: Map<string, Set<() => void>> = new Map()

  private getParameterKey(instanceId: number, parameterId: number): string {
    return `instance:${instanceId}:parameter:${parameterId}`
  }
  
  private getInstanceKey(instanceId: number): string {
    return `instance:${instanceId}`
  }
  
  private notifyListeners(key: string): void {
    this.listeners.get(key)?.forEach(listener => listener())
  }
  
  getSnapshot(instanceId: number, parameterId: number): ParameterSnapshot | null {
    return this.snapshots[instanceId]?.[parameterId] || null
  }
  
  getInstanceSnapshots(instanceId: number): Record<number, ParameterSnapshot> {
    return this.snapshots[instanceId] || {}
  }
  
  setSnapshot(snapshot: ParameterSnapshot): boolean {
    const { instanceId, parameterId } = snapshot
    
    if (!instanceId || !parameterId) return false
    

    if (!this.snapshots[instanceId]) {
      this.snapshots[instanceId] = {}
    }
    
    const currentSnapshot = this.snapshots[instanceId][parameterId]
    
    if (!currentSnapshot || new Date(snapshot.updatedAt) > new Date(currentSnapshot.updatedAt)) {
      this.snapshots[instanceId][parameterId] = snapshot
      this.notifyListeners(this.getParameterKey(instanceId, parameterId))
      this.notifyListeners(this.getInstanceKey(instanceId))
      return true
    }
    
    return false
  }
  
  // Used for initial snapshot data load from instances
  setSnapshots(instanceId: number, snapshots: ParameterSnapshot[]): void {
    if (!this.snapshots[instanceId]) {
      this.snapshots[instanceId] = {}
    }
    
    let updated = false
    snapshots.forEach(snapshot => {
      if (!snapshot.parameterId) return
      
      const currentSnapshot = this.snapshots[instanceId][snapshot.parameterId]
      
      if (!currentSnapshot || new Date(snapshot.updatedAt) > new Date(currentSnapshot.updatedAt)) {
        this.snapshots[instanceId][snapshot.parameterId] = snapshot
        updated = true
      }
    })
    
    if (updated) {
      this.notifyListeners(this.getInstanceKey(instanceId))
    }
  }
  
  subscribe(instanceId: number, parameterId: number, listener: () => void): () => void {
    const key = this.getParameterKey(instanceId, parameterId)
    
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
  
  subscribeToInstance(instanceId: number, listener: () => void): () => void {
    const key = this.getInstanceKey(instanceId)
    
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
}

// Single store used in context and hooks
export const parameterSnapshotStore = new ParameterSnapshotStore()