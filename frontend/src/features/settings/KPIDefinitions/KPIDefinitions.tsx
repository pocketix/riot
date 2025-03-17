import { Button } from '@/components/ui/button'
import { KpiDefinitionsQuery, KpiDefinitionsQueryVariables } from '@/generated/graphql'
import { GET_KPI_DEFINITIONS } from '@/graphql/Queries'
import Heading from '@/ui/Heading'
import Spinner from '@/ui/Spinner'
import { useQuery } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

export default function KPIDefinitions() {
  const navigate = useNavigate()
  const { data, loading } = useQuery<KpiDefinitionsQuery, KpiDefinitionsQueryVariables>(GET_KPI_DEFINITIONS, {
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first'
  })

  if (loading) return <Spinner />
  if (!data?.kpiDefinitions?.length) return <p>No device types found.</p>

  return (
    <Container>
      <Header>
        <Heading as="h2">
          Manage your KPI definitions here{' '}
          <span
            style={{
              fontWeight: '200',
              fontStyle: 'italic',
              textWrap: 'nowrap'
            }}
          >
            ({data?.kpiDefinitions?.length} definitions).
          </span>
        </Heading>
        <Button
          onClick={() => {
            navigate('/settings/kpi-definitions/create')
          }}
        >
          + Add new
        </Button>
      </Header>
    </Container>
  )
}
