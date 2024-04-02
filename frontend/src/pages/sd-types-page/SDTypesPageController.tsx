import React, { useCallback } from 'react'
import { ApolloError, MutationFunction, MutationTuple, QueryResult, useMutation, useQuery } from '@apollo/client'
import {
  CreateSdTypeMutation, CreateSdTypeMutationVariables,
  DeleteSdTypeMutation, DeleteSdTypeMutationVariables, SdParameterType,
  SdTypesQuery, SdTypesQueryVariables
} from '../../generated/graphql'
import gql from 'graphql-tag'
import qSDTypes from '../../graphql/queries/sdTypes.graphql'
import { RefetchFunction } from '@apollo/client/react/hooks/useSuspenseQuery'
import SDTypesPageView from './SDTypesPageView'
import mDeleteSDType from '../../graphql/mutations/deleteSDType.graphql'
import mCreateSDType from '../../graphql/mutations/createSDType.graphql'

const SDTypesPageController: React.FC = () => {
  const sdTypesQueryResult: QueryResult<SdTypesQuery, SdTypesQueryVariables> = useQuery<SdTypesQuery, SdTypesQueryVariables>(gql(qSDTypes))
  const sdTypesQueryData: SdTypesQuery = sdTypesQueryResult.data
  const sdTypesQueryLoading: boolean = sdTypesQueryResult.loading
  const sdTypesQueryError: ApolloError | undefined = sdTypesQueryResult.error
  const sdTypesQueryRefetchFunction: RefetchFunction<SdTypesQuery, SdTypesQueryVariables> = sdTypesQueryResult.refetch

  const deleteSDTypeMutationResult: MutationTuple<DeleteSdTypeMutation, DeleteSdTypeMutationVariables> = useMutation<DeleteSdTypeMutation, DeleteSdTypeMutationVariables>(gql(mDeleteSDType))
  const deleteSDTypeMutationFunction: MutationFunction<DeleteSdTypeMutation, DeleteSdTypeMutationVariables> = deleteSDTypeMutationResult[0]
  const deleteSDTypeMutationLoading: boolean = deleteSDTypeMutationResult[1].loading
  const deleteSDTypeMutationError: ApolloError | undefined = deleteSDTypeMutationResult[1].error

  const createSDTypeMutationResult: MutationTuple<CreateSdTypeMutation, CreateSdTypeMutationVariables> = useMutation<CreateSdTypeMutation, CreateSdTypeMutationVariables>(gql(mCreateSDType))
  const createSDTypeMutationFunction: MutationFunction<CreateSdTypeMutation, CreateSdTypeMutationVariables> = createSDTypeMutationResult[0]
  const createSDTypeMutationLoading: boolean = createSDTypeMutationResult[1].loading
  const createSDTypeMutationError: ApolloError | undefined = createSDTypeMutationResult[1].error

  const refetchSDTypes = useCallback(async () => {
    await sdTypesQueryRefetchFunction()
  }, [sdTypesQueryRefetchFunction])

  const createSDType = useCallback(
    async (denotation: string, parameters: { denotation: string, type: 'STRING' | 'NUMBER' | 'BOOLEAN' }[]) => {
      const transformParameterType = (type: 'STRING' | 'NUMBER' | 'BOOLEAN'): SdParameterType => {
        switch (type) {
          case 'STRING':
            return SdParameterType.String
          case 'NUMBER':
            return SdParameterType.Number
          case 'BOOLEAN':
            return SdParameterType.Boolean
        }
      }

      await createSDTypeMutationFunction({
        variables: {
          input: {
            denotation: denotation,
            parameters: parameters.map((p) => {
              return {
                denotation: p.denotation,
                type: transformParameterType(p.type)
              }
            })
          }
        }
      })
      await refetchSDTypes()
    },
    [createSDTypeMutationFunction, refetchSDTypes]
  )

  const deleteSDType = useCallback(
    async (id: string) => {
      await deleteSDTypeMutationFunction({
        variables: {
          id: id
        }
      })
      await refetchSDTypes()
    },
    [deleteSDTypeMutationFunction, refetchSDTypes]
  )

  const anyLoadingOccurs: boolean = sdTypesQueryLoading || deleteSDTypeMutationLoading || createSDTypeMutationLoading
  const anyErrorOccurred: boolean = !!sdTypesQueryError || !!deleteSDTypeMutationError || !!createSDTypeMutationError

  return <SDTypesPageView sdTypesQueryData={sdTypesQueryData} createSDType={createSDType} deleteSDType={deleteSDType} anyLoadingOccurs={anyLoadingOccurs} anyErrorOccurred={anyErrorOccurred} />
}

export default SDTypesPageController
