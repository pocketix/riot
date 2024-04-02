import React, { useCallback } from 'react'
import { ApolloError, MutationFunction, MutationTuple, QueryResult, useMutation, useQuery } from '@apollo/client'
import { SdInstancesQuery, SdInstancesQueryVariables, UpdateUserIdentifierOfSdInstanceMutation, UpdateUserIdentifierOfSdInstanceMutationVariables } from '../../generated/graphql'
import gql from 'graphql-tag'
import qSDInstances from '../../graphql/queries/sdInstances.graphql'
import SDInstancesPageView from './SDInstancesPageView'
import { RefetchFunction } from '@apollo/client/react/hooks/useSuspenseQuery'
import mUpdateUserIdentifierOfSDInstance from '../../graphql/mutations/updateUserIdentifierOfSDInstance.graphql'

const SDInstancesPageController: React.FC = () => {
  const sdInstancesQueryResult: QueryResult<SdInstancesQuery, SdInstancesQueryVariables> = useQuery<SdInstancesQuery, SdInstancesQueryVariables>(gql(qSDInstances))
  const sdInstancesQueryData: SdInstancesQuery = sdInstancesQueryResult.data
  const sdInstancesQueryLoading: boolean = sdInstancesQueryResult.loading
  const sdInstancesQueryError: ApolloError | undefined = sdInstancesQueryResult.error
  const sdInstancesQueryRefetchFunction: RefetchFunction<SdInstancesQuery, SdInstancesQueryVariables> = sdInstancesQueryResult.refetch

  const updateUserIdentifierOfSdInstanceMutationResult: MutationTuple<UpdateUserIdentifierOfSdInstanceMutation, UpdateUserIdentifierOfSdInstanceMutationVariables> = useMutation<UpdateUserIdentifierOfSdInstanceMutation, UpdateUserIdentifierOfSdInstanceMutationVariables>(gql(mUpdateUserIdentifierOfSDInstance))
  const updateUserIdentifierOfSdInstanceMutationFunction: MutationFunction<UpdateUserIdentifierOfSdInstanceMutation, UpdateUserIdentifierOfSdInstanceMutationVariables> = updateUserIdentifierOfSdInstanceMutationResult[0]
  const updateUserIdentifierOfSdInstanceMutationLoading: boolean = updateUserIdentifierOfSdInstanceMutationResult[1].loading
  const updateUserIdentifierOfSdInstanceMutationError: ApolloError | undefined = updateUserIdentifierOfSdInstanceMutationResult[1].error

  const anyLoadingOccurs: boolean = sdInstancesQueryLoading || updateUserIdentifierOfSdInstanceMutationLoading
  const anyErrorOccurred: boolean = !!sdInstancesQueryError || !!updateUserIdentifierOfSdInstanceMutationError

  const refetchSDInstances = useCallback(async (): Promise<void> => {
    await sdInstancesQueryRefetchFunction()
  }, [sdInstancesQueryRefetchFunction()])

  const updateUserIdentifierOfSdInstance = useCallback(
    async (id: string, newUserIdentifier: string): Promise<void> => {
      await updateUserIdentifierOfSdInstanceMutationFunction({
        variables: {
          id: id,
          newUserIdentifier: newUserIdentifier
        }
      })
    },
    [updateUserIdentifierOfSdInstanceMutationFunction]
  )

  return <SDInstancesPageView sdInstancesQueryData={sdInstancesQueryData} refetchSDInstances={refetchSDInstances} updateUserIdentifierOfSdInstance={updateUserIdentifierOfSdInstance} anyLoadingOccurs={anyLoadingOccurs} anyErrorOccurred={anyErrorOccurred} />
}

export default SDInstancesPageController
