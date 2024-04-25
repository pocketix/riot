import React from 'react'
import KPIPageView from './KPIPageView'
import { useQuery } from '@apollo/client'
import { KpiDefinitionsQuery, KpiDefinitionsQueryVariables } from '../../generated/graphql'
import gql from 'graphql-tag'
import qKPIDefinitions from '../../graphql/queries/kpiDefinitions.graphql'

const KPIPageController: React.FC = () => {
  const { data, loading, error } = useQuery<KpiDefinitionsQuery, KpiDefinitionsQueryVariables>(gql(qKPIDefinitions))
  return <KPIPageView kpiDefinitionsData={data} anyLoadingOccurs={loading} anyErrorOccurred={!!error}></KPIPageView>
}

export default KPIPageController
