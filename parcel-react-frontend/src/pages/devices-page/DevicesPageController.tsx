import React, { useCallback } from 'react'
import { ApolloError, MutationFunction, MutationTuple, QueryResult, useMutation, useQuery } from '@apollo/client'
import { DevicesQuery, DevicesQueryVariables, UpdateDeviceNameMutation, UpdateDeviceNameMutationVariables } from '../../generated/graphql'
import gql from 'graphql-tag'
import DEVICES_QUERY from '../../graphql/queries/devices.graphql'
import DevicesPageView from './DevicesPageView'
import { RefetchFunction } from '@apollo/client/react/hooks/useSuspenseQuery'
import UPDATE_DEVICE_NAME_MUTATION from '../../graphql/mutations/updateDeviceName.graphql'

const DevicesPageController: React.FC = () => {
  const devicesQueryResult: QueryResult<DevicesQuery, DevicesQueryVariables> = useQuery<DevicesQuery, DevicesQueryVariables>(gql`
    ${DEVICES_QUERY}
  `)
  const devicesQueryData: DevicesQuery = devicesQueryResult.data
  const devicesQueryLoading: boolean = devicesQueryResult.loading
  const devicesQueryError: ApolloError | undefined = devicesQueryResult.error
  const devicesQueryRefetchFunction: RefetchFunction<DevicesQuery, DevicesQueryVariables> = devicesQueryResult.refetch

  const updateDeviceNameMutationResult: MutationTuple<UpdateDeviceNameMutation, UpdateDeviceNameMutationVariables> = useMutation<UpdateDeviceNameMutation, UpdateDeviceNameMutationVariables>(gql`
    ${UPDATE_DEVICE_NAME_MUTATION}
  `)
  const updateDeviceNameMutationFunction: MutationFunction<UpdateDeviceNameMutation, UpdateDeviceNameMutationVariables> = updateDeviceNameMutationResult[0]
  const updateDeviceNameMutationLoading: boolean = updateDeviceNameMutationResult[1].loading
  const updateDeviceNameMutationError: ApolloError | undefined = updateDeviceNameMutationResult[1].error

  const anyLoadingOccurs: boolean = devicesQueryLoading || updateDeviceNameMutationLoading
  const anyErrorOccurred: boolean = !!devicesQueryError || !!updateDeviceNameMutationError

  const refetchDevices = useCallback(async () => {
    await devicesQueryRefetchFunction()
  }, [devicesQueryRefetchFunction()])

  const updateDeviceName = useCallback(
    async (id: string, newName: string) => {
      await updateDeviceNameMutationFunction({
        variables: {
          id: id,
          newName: newName
        }
      })
    },
    [updateDeviceNameMutationFunction]
  )

  return <DevicesPageView devicesQueryData={devicesQueryData} refetchDevices={refetchDevices} updateDeviceName={updateDeviceName} anyLoadingOccurs={anyLoadingOccurs} anyErrorOccurred={anyErrorOccurred} />
}

export default DevicesPageController
