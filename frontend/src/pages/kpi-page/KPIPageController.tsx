import React, { useCallback } from 'react'
import KPIPageView from './KPIPageView'
import { ApolloError, QueryResult, useQuery } from '@apollo/client'
import { KpiDefinitionsQuery, KpiDefinitionsQueryVariables } from '../../generated/graphql'
import gql from 'graphql-tag'
import qKPIDefinitions from '../../graphql/queries/kpiDefinitions.graphql'
import { RefetchFunction } from '@apollo/client/react/hooks/useSuspenseQuery'

const KPIPageController: React.FC = () => {
  const kpiDefinitionsQueryResult: QueryResult<KpiDefinitionsQuery, KpiDefinitionsQueryVariables> = useQuery<KpiDefinitionsQuery, KpiDefinitionsQueryVariables>(gql(qKPIDefinitions))
  const kpiDefinitionsQueryData: KpiDefinitionsQuery = kpiDefinitionsQueryResult.data
  const kpiDefinitionsQueryLoading: boolean = kpiDefinitionsQueryResult.loading
  const kpiDefinitionsQueryError: ApolloError | undefined = kpiDefinitionsQueryResult.error
  const kpiDefinitionsQueryRefetchFunction: RefetchFunction<KpiDefinitionsQuery, KpiDefinitionsQueryVariables> = kpiDefinitionsQueryResult.refetch

  const refetchKPIDefinitions = useCallback(async () => {
    await kpiDefinitionsQueryRefetchFunction()
  }, [kpiDefinitionsQueryRefetchFunction])

  return <KPIPageView kpiDefinitionsData={kpiDefinitionsQueryData} refetchKPIDefinitions={refetchKPIDefinitions} anyLoadingOccurs={kpiDefinitionsQueryLoading} anyErrorOccurred={!!kpiDefinitionsQueryError}></KPIPageView>
}

export default KPIPageController
