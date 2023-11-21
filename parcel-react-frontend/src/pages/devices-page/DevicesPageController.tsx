import React from 'react'
import { ApolloError, QueryResult, useQuery } from '@apollo/client'
import { DevicesQuery, DevicesQueryVariables } from '../../generated/graphql'
import gql from 'graphql-tag'
import DEVICES_QUERY from '../../graphql/queries/devices.graphql'
import DevicesPageView from './DevicesPageView'

const DevicesPageController: React.FC = () => {
  const devicesQueryResult: QueryResult<DevicesQuery, DevicesQueryVariables> = useQuery<DevicesQuery, DevicesQueryVariables>(gql`
    ${DEVICES_QUERY}
  `)
  const devicesQueryData: DevicesQuery = devicesQueryResult.data
  const devicesQueryLoading: boolean = devicesQueryResult.loading
  const devicesQueryError: ApolloError | undefined = devicesQueryResult.error

  const anyLoadingOccurs: boolean = devicesQueryLoading
  const anyErrorOccurred: boolean = !!devicesQueryError

  return <DevicesPageView devicesQueryData={devicesQueryData} anyLoadingOccurs={anyLoadingOccurs} anyErrorOccurred={anyErrorOccurred} />
}

export default DevicesPageController
