import React, { useCallback } from 'react'
import { ApolloError, MutationFunction, MutationTuple, QueryResult, useMutation, useQuery } from '@apollo/client'
import { CreateNewDeviceTypeMutation, CreateNewDeviceTypeMutationVariables, DeleteDeviceTypeMutation, DeleteDeviceTypeMutationVariables, DeviceTypeParameterType, DeviceTypesQuery, DeviceTypesQueryVariables } from '../../generated/graphql'
import gql from 'graphql-tag'
import DEVICE_TYPES_QUERY from '../../graphql/queries/deviceTypes.graphql'
import { RefetchFunction } from '@apollo/client/react/hooks/useSuspenseQuery'
import DeviceTypesPageView from './DeviceTypesPageView'
import DELETE_DEVICE_TYPE_MUTATION from '../../graphql/mutations/deleteDeviceType.graphql'
import CREATE_NEW_DEVICE_TYPE_MUTATION from '../../graphql/mutations/createNewDeviceType.graphql'

const DeviceTypesPageController: React.FC = () => {
  const deviceTypesQueryResult: QueryResult<DeviceTypesQuery, DeviceTypesQueryVariables> = useQuery<DeviceTypesQuery, DeviceTypesQueryVariables>(gql`
    ${DEVICE_TYPES_QUERY}
  `)
  const deviceTypesQueryData: DeviceTypesQuery = deviceTypesQueryResult.data
  const deviceTypesQueryLoading: boolean = deviceTypesQueryResult.loading
  const deviceTypesQueryError: ApolloError | undefined = deviceTypesQueryResult.error
  const deviceTypesQueryRefetchFunction: RefetchFunction<DeviceTypesQuery, DeviceTypesQueryVariables> = deviceTypesQueryResult.refetch

  const deleteDeviceTypeMutationResult: MutationTuple<DeleteDeviceTypeMutation, DeleteDeviceTypeMutationVariables> = useMutation<DeleteDeviceTypeMutation, DeleteDeviceTypeMutationVariables>(gql`
    ${DELETE_DEVICE_TYPE_MUTATION}
  `)
  const deleteDeviceTypeMutationFunction: MutationFunction<DeleteDeviceTypeMutation, DeleteDeviceTypeMutationVariables> = deleteDeviceTypeMutationResult[0]
  const deleteDeviceTypeMutationLoading: boolean = deleteDeviceTypeMutationResult[1].loading
  const deleteDeviceTypeMutationError: ApolloError | undefined = deleteDeviceTypeMutationResult[1].error

  const createNewDeviceTypeMutationResult: MutationTuple<CreateNewDeviceTypeMutation, CreateNewDeviceTypeMutationVariables> = useMutation<CreateNewDeviceTypeMutation, CreateNewDeviceTypeMutationVariables>(gql`
    ${CREATE_NEW_DEVICE_TYPE_MUTATION}
  `)
  const createNewDeviceTypeMutationFunction: MutationFunction<CreateNewDeviceTypeMutation, CreateNewDeviceTypeMutationVariables> = createNewDeviceTypeMutationResult[0]
  const createNewDeviceTypeMutationLoading: boolean = createNewDeviceTypeMutationResult[1].loading
  const createNewDeviceTypeMutationError: ApolloError | undefined = createNewDeviceTypeMutationResult[1].error

  const refetchDeviceTypes = useCallback(async () => {
    await deviceTypesQueryRefetchFunction()
  }, [deviceTypesQueryRefetchFunction])

  const createNewDeviceType = useCallback(
    async (denotation: string, parameters: { name: string; type: 'STRING' | 'NUMBER' | 'BOOLEAN' }[]) => {
      const transformParameterType = (type: 'STRING' | 'NUMBER' | 'BOOLEAN'): DeviceTypeParameterType => {
        switch (type) {
          case 'STRING':
            return DeviceTypeParameterType.String
          case 'NUMBER':
            return DeviceTypeParameterType.Number
          case 'BOOLEAN':
            return DeviceTypeParameterType.Boolean
        }
      }

      await createNewDeviceTypeMutationFunction({
        variables: {
          input: {
            denotation: denotation,
            parameters: parameters.map((p) => {
              return {
                name: p.name,
                type: transformParameterType(p.type)
              }
            })
          }
        }
      })
      await refetchDeviceTypes()
    },
    [deleteDeviceTypeMutationFunction, refetchDeviceTypes]
  )

  const deleteDeviceType = useCallback(
    async (id: string) => {
      await deleteDeviceTypeMutationFunction({
        variables: {
          input: id
        }
      })
      await refetchDeviceTypes()
    },
    [deleteDeviceTypeMutationFunction, refetchDeviceTypes]
  )

  const anyLoadingOccurs: boolean = deviceTypesQueryLoading || createNewDeviceTypeMutationLoading || deleteDeviceTypeMutationLoading
  const anyErrorOccurred: boolean = !!deviceTypesQueryError || !!createNewDeviceTypeMutationError || !!deleteDeviceTypeMutationError

  return <DeviceTypesPageView deviceTypesQueryData={deviceTypesQueryData} createNewDeviceType={createNewDeviceType} deleteDeviceType={deleteDeviceType} anyLoadingOccurs={anyLoadingOccurs} anyErrorOccurred={anyErrorOccurred} />
}

export default DeviceTypesPageController
