import { Button } from '@/components/ui/button'
import { KpiDefinitionsQuery, KpiDefinitionsQueryVariables, DeleteKpiDefinitionMutation, DeleteKpiDefinitionMutationVariables } from '@/generated/graphql'
import { GET_KPI_DEFINITIONS } from '@/graphql/Queries'
import { DELETE_KPI_DEFINITION } from '@/graphql/Mutations'
import Heading from '@/ui/Heading'
import Spinner from '@/ui/Spinner'
import { useMutation, useQuery } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import KPIDefinitionCard from './KPiDefinitionCard'
import { toast } from 'sonner'

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

const Grid = styled.div`
  display: grid;
  gap: 1.5rem;
  justify-content: center;
  grid-template-columns: 1fr;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`

export default function KPIDefinitions() {
  const navigate = useNavigate()

  const { data, loading, refetch } = useQuery<KpiDefinitionsQuery, KpiDefinitionsQueryVariables>(GET_KPI_DEFINITIONS, {
    fetchPolicy: 'cache-first'
  })

  const [deleteKpiDefinitionMutation] = useMutation<DeleteKpiDefinitionMutation, DeleteKpiDefinitionMutationVariables>(DELETE_KPI_DEFINITION)

  const handleDelete = async (id: number) => {
    try {
      await deleteKpiDefinitionMutation({
        variables: { id },
        update: (cache) => {
          cache.modify({
            fields: {
              kpiDefinitions(existingKpis = [], { readField }) {
                return existingKpis.filter((kpiRef: any) => readField('id', kpiRef) !== id)
              }
            }
          })
        }
      })
      toast.success('KPI Definition deleted successfully')
      await refetch()
    } catch (error) {
      toast.error('Failed to delete KPI Definition')
      console.error('Deletion failed:', error)
    }
  }

  if (loading) return <Spinner />
  if (!data?.kpiDefinitions?.length) return <p>No KPI definitions found.</p>

  console.log(data)

  return (
    <Container>
      <Header>
        <Heading as="h2">
          Manage your KPI definitions here <span style={{ fontWeight: '200', fontStyle: 'italic', textWrap: 'nowrap' }}>({data?.kpiDefinitions?.length} definitions).</span>
        </Heading>
        <Button onClick={() => navigate('/settings/kpi-definitions/create')}>+ Add new</Button>
      </Header>

      <Grid>
        {data.kpiDefinitions.map((kpiDefinition) => (
          <KPIDefinitionCard key={kpiDefinition.id} kpiDefinition={kpiDefinition} onDelete={handleDelete} />
        ))}
      </Grid>
    </Container>
  )
}
