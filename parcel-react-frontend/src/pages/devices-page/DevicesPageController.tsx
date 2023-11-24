import React, { useCallback } from 'react'
import { ApolloError, QueryResult, useQuery } from '@apollo/client'
import { DevicesQuery, DevicesQueryVariables } from '../../generated/graphql'
import gql from 'graphql-tag'
import DEVICES_QUERY from '../../graphql/queries/devices.graphql'
import DevicesPageView from './DevicesPageView'
import { RefetchFunction } from '@apollo/client/react/hooks/useSuspenseQuery'

const DevicesPageController: React.FC = () => {
  const devicesQueryResult: QueryResult<DevicesQuery, DevicesQueryVariables> = useQuery<DevicesQuery, DevicesQueryVariables>(gql`
    ${DEVICES_QUERY}
  `)
  const devicesQueryData: DevicesQuery = devicesQueryResult.data
  const devicesQueryLoading: boolean = devicesQueryResult.loading
  const devicesQueryError: ApolloError | undefined = devicesQueryResult.error
  const devicesQueryRefetchFunction: RefetchFunction<DevicesQuery, DevicesQueryVariables> = devicesQueryResult.refetch

  const anyLoadingOccurs: boolean = devicesQueryLoading
  const anyErrorOccurred: boolean = !!devicesQueryError

  const refetchDevices = useCallback(async () => {
    await devicesQueryRefetchFunction()
  }, [devicesQueryRefetchFunction()])

  return <DevicesPageView devicesQueryData={devicesQueryData} refetchDevices={refetchDevices} anyLoadingOccurs={anyLoadingOccurs} anyErrorOccurred={anyErrorOccurred} />
}

export default DevicesPageController
