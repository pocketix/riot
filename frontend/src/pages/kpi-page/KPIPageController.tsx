import React, { useCallback } from 'react'
import KPIPageView from './KPIPageView'
import { useQuery } from '@apollo/client'
import { KpiDefinitionsQuery, KpiDefinitionsQueryVariables } from '../../generated/graphql'
import gql from 'graphql-tag'
import qKPIDefinitions from '../../graphql/queries/kpiDefinitions.graphql'

const KPIPageController: React.FC = () => {
  const { data, loading, error, refetch } = useQuery<KpiDefinitionsQuery, KpiDefinitionsQueryVariables>(gql(qKPIDefinitions))

  const refetchKPIDefinitions = useCallback(async () => {
    await refetch()
  }, [refetch])

  return <KPIPageView kpiDefinitionsData={data} refetchKPIDefinitions={refetchKPIDefinitions} anyLoadingOccurs={loading} anyErrorOccurred={!!error}></KPIPageView>
}

export default KPIPageController
