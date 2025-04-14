import { createContext, useContext, ReactNode } from 'react'
import {
  SdInstancesWithTypeAndSnapshotQuery,
  useSdInstancesWithTypeAndSnapshotQuery,
  useGroupsQuery,
  GroupsQuery,
  useGetAllSdTypesQuery,
  GetAllSdTypesQuery
} from '@/generated/graphql'

export type Instance = SdInstancesWithTypeAndSnapshotQuery['sdInstances'][0]
export type Group = GroupsQuery['sdInstanceGroups'][0]
export type Parameter = GetAllSdTypesQuery['sdTypes'][0]['parameters'][number]

interface InstancesContextState {
  instances: Instance[]
  groups: Group[]

  getInstanceByUid: (uid: string) => Instance | undefined
  getInstanceById: (id: number) => Instance | undefined
  getInstanceGroups: (instanceId: number) => Group[]
  getParameterByIds: (instanceId: number, parameterId: number) => Parameter | null
  getInstanceParameters: (instanceId: number) => Parameter[]

  isLoading: boolean
  isError: boolean
}

const InstancesContext = createContext<InstancesContextState | undefined>(undefined)

export function InstancesProvider({ children }: { children: ReactNode }) {
  const {
    data: instancesData,
    loading: instancesLoading,
    error: instancesError
  } = useSdInstancesWithTypeAndSnapshotQuery()
  const { data: typesData, loading: typesLoading, error: typesError } = useGetAllSdTypesQuery()
  const { data: groupsData, loading: groupsLoading, error: groupsError } = useGroupsQuery()

  const instances = instancesData?.sdInstances || []
  const groups = groupsData?.sdInstanceGroups || []

  const filteredInstances = instances.filter((instance) => {
    const userConfirmed = instance.confirmedByUser
    return userConfirmed === true
  })

  const getInstanceByUid = (uid: string) => instances.find((instance) => instance.uid === uid)
  const getInstanceById = (id: number) => instances.find((instance) => instance.id === id)
  const getInstanceGroups = (instanceId: number) => groups.filter((group) => group.sdInstanceIDs.includes(instanceId))

  const getParameterByIds = (instanceId: number, parameterId: number) => {
    const instance = getInstanceById(instanceId)
    if (!instance) return null
    const type = typesData?.sdTypes.find((type) => type.id === instance.type.id)
    if (!type) return null
    const parameter = type.parameters.find((param) => param.id === parameterId)
    if (!parameter) return null
    return parameter
  }
  const getInstanceParameters = (instanceId: number): Parameter[] => {
    const instance = getInstanceById(instanceId)
    if (!instance) return []
    const type = typesData?.sdTypes.find((type) => type.id === instance.type.id)
    if (!type) return []
    const parameters = type.parameters
    if (!parameters) return []
    return parameters
  }

  const contextValue: InstancesContextState = {
    instances: filteredInstances,
    groups,

    isLoading: instancesLoading || groupsLoading || typesLoading,
    isError: !!instancesError || !!groupsError || !!typesError,

    getInstanceByUid,
    getInstanceById,
    getInstanceGroups,
    getParameterByIds,
    getInstanceParameters
  }

  return <InstancesContext.Provider value={contextValue}>{children}</InstancesContext.Provider>
}

export function useInstancesContext() {
  const context = useContext(InstancesContext)
  if (context === undefined) {
    throw new Error('useInstancesContext must be used within an InstancesProvider')
  }
  return context
}

export function useInstances() {
  return useInstancesContext()
}
