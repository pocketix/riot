import React, { useCallback } from 'react'
import { ApolloError, MutationFunction, MutationTuple, QueryResult, useMutation, useQuery } from '@apollo/client'
import {
  CreateNewUserDefinedDeviceTypeMutation,
  CreateNewUserDefinedDeviceTypeMutationVariables,
  DeleteUserDefinedDeviceTypeMutation,
  DeleteUserDefinedDeviceTypeMutationVariables,
  UserDefinedDeviceTypesQuery,
  UserDefinedDeviceTypesQueryVariables
} from '../../generated/graphql'
import gql from 'graphql-tag'
import USER_DEFINED_DEVICE_TYPES_QUERY from '../../graphql/queries/userDefinedDeviceTypes.graphql'
import { RefetchFunction } from '@apollo/client/react/hooks/useSuspenseQuery'
import DeviceTypesPageView from './DeviceTypesPageView'
import DELETE_USER_DEFINED_DEVICE_TYPE_MUTATION from '../../graphql/mutations/deleteUserDefinedDeviceType.graphql'
import CREATE_NEW_USER_DEFINED_DEVICE_TYPE_MUTATION from '../../graphql/mutations/createNewUserDefinedDeviceType.graphql'

const DeviceTypesPageController: React.FC = () => {
  const userDefinedDeviceTypesQueryResult: QueryResult<UserDefinedDeviceTypesQuery, UserDefinedDeviceTypesQueryVariables> = useQuery<UserDefinedDeviceTypesQuery, UserDefinedDeviceTypesQueryVariables>(gql`
    ${USER_DEFINED_DEVICE_TYPES_QUERY}
  `)
  const userDefinedDeviceTypesQueryData: UserDefinedDeviceTypesQuery = userDefinedDeviceTypesQueryResult.data
  const userDefinedDeviceTypesQueryLoading: boolean = userDefinedDeviceTypesQueryResult.loading
  const userDefinedDeviceTypesQueryError: ApolloError | undefined = userDefinedDeviceTypesQueryResult.error
  const userDefinedDeviceTypesQueryRefetchFunction: RefetchFunction<UserDefinedDeviceTypesQuery, UserDefinedDeviceTypesQueryVariables> = userDefinedDeviceTypesQueryResult.refetch

  const deleteUserDefinedDeviceTypeMutationResult: MutationTuple<DeleteUserDefinedDeviceTypeMutation, DeleteUserDefinedDeviceTypeMutationVariables> = useMutation<DeleteUserDefinedDeviceTypeMutation, DeleteUserDefinedDeviceTypeMutationVariables>(gql`
    ${DELETE_USER_DEFINED_DEVICE_TYPE_MUTATION}
  `)
  const deleteUserDefinedDeviceTypeMutationFunction: MutationFunction<DeleteUserDefinedDeviceTypeMutation, DeleteUserDefinedDeviceTypeMutationVariables> = deleteUserDefinedDeviceTypeMutationResult[0]
  const deleteUserDefinedDeviceTypeMutationLoading: boolean = deleteUserDefinedDeviceTypeMutationResult[1].loading
  const deleteUserDefinedDeviceTypeMutationError: ApolloError | undefined = deleteUserDefinedDeviceTypeMutationResult[1].error

  const createNewUserDefinedDeviceTypeMutationResult: MutationTuple<CreateNewUserDefinedDeviceTypeMutation, CreateNewUserDefinedDeviceTypeMutationVariables> = useMutation<
    CreateNewUserDefinedDeviceTypeMutation,
    CreateNewUserDefinedDeviceTypeMutationVariables
  >(gql`
    ${CREATE_NEW_USER_DEFINED_DEVICE_TYPE_MUTATION}
  `)
  const createNewUserDefinedDeviceTypeMutationFunction: MutationFunction<CreateNewUserDefinedDeviceTypeMutation, CreateNewUserDefinedDeviceTypeMutationVariables> = createNewUserDefinedDeviceTypeMutationResult[0]
  const createNewUserDefinedDeviceTypeMutationLoading: boolean = createNewUserDefinedDeviceTypeMutationResult[1].loading
  const createNewUserDefinedDeviceTypeMutationError: ApolloError | undefined = createNewUserDefinedDeviceTypeMutationResult[1].error

  const refetchUserDefinedDeviceTypes = useCallback(async () => {
    await userDefinedDeviceTypesQueryRefetchFunction()
  }, [userDefinedDeviceTypesQueryRefetchFunction])

  const createNewUserDefinedDeviceType = useCallback(
    async (denotation: string) => {
      await createNewUserDefinedDeviceTypeMutationFunction({
        variables: {
          input: {
            denotation: denotation,
            parameters: []
          }
        }
      })
      await refetchUserDefinedDeviceTypes()
    },
    [deleteUserDefinedDeviceTypeMutationFunction, refetchUserDefinedDeviceTypes]
  )

  const deleteUserDefinedDeviceType = useCallback(
    async (id: string) => {
      await deleteUserDefinedDeviceTypeMutationFunction({
        variables: {
          input: id
        }
      })
      await refetchUserDefinedDeviceTypes()
    },
    [deleteUserDefinedDeviceTypeMutationFunction, refetchUserDefinedDeviceTypes]
  )

  const anyLoadingOccurs: boolean = userDefinedDeviceTypesQueryLoading || createNewUserDefinedDeviceTypeMutationLoading || deleteUserDefinedDeviceTypeMutationLoading
  const anyErrorOccurred: boolean = !!userDefinedDeviceTypesQueryError || !!createNewUserDefinedDeviceTypeMutationError || !!deleteUserDefinedDeviceTypeMutationError

  return (
    <DeviceTypesPageView
      userDefinedDeviceTypesQueryData={userDefinedDeviceTypesQueryData}
      createNewUserDefinedDeviceType={createNewUserDefinedDeviceType}
      deleteUserDefinedDeviceType={deleteUserDefinedDeviceType}
      anyLoadingOccurs={anyLoadingOccurs}
      anyErrorOccurred={anyErrorOccurred}
    />
  )
}

export default DeviceTypesPageController
