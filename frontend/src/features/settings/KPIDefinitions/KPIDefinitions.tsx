import { Button } from '@/components/ui/button'
import {
  KpiDefinitionsQuery,
  KpiDefinitionsQueryVariables,
  DeleteKpiDefinitionMutation,
  DeleteKpiDefinitionMutationVariables
} from '@/generated/graphql'
import { GET_KPI_DEFINITIONS } from '@/graphql/Queries'
import { DELETE_KPI_DEFINITION } from '@/graphql/Mutations'
import Heading from '@/ui/Heading'
import Spinner from '@/ui/Spinner'
import { useMutation, useQuery } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { toast } from 'sonner'
import KPIDefinitionCard from './KPIDefinitionCard'
import { breakpoints } from '@/styles/Breakpoints'
import { useTranslation } from 'react-i18next'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const Header = styled.div`
  display: flex;
  gap: 1rem;
  flex-direction: column;

  @media (min-width: ${breakpoints.sm}) {
    justify-content: space-between;
    align-items: center;
    flex-direction: row;
  }
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
  const { t } = useTranslation()

  const { data, loading, refetch } = useQuery<KpiDefinitionsQuery, KpiDefinitionsQueryVariables>(GET_KPI_DEFINITIONS, {
    fetchPolicy: 'cache-first'
  })

  const [deleteKpiDefinitionMutation] = useMutation<DeleteKpiDefinitionMutation, DeleteKpiDefinitionMutationVariables>(
    DELETE_KPI_DEFINITION
  )

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
  if (!data?.kpiDefinitions?.length) return <p>{t('kpiDefinitionsPage.noKpiFound')}</p>

  return (
    <Container>
      <Header>
        <Heading as="h2">
          {t('kpiDefinitionsPage.manageKpiDefinitions')}{' '}
          <span style={{ fontWeight: '200', fontStyle: 'italic', textWrap: 'nowrap' }}>
            ({t('kpiDefinitionsPage.definitions', { count: data?.kpiDefinitions?.length || 0 })}).
          </span>
        </Heading>
        <Button onClick={() => navigate('/settings/kpi-definitions/create')}>+ {t('addNew')}</Button>
      </Header>

      <Grid>
        {data.kpiDefinitions.map((kpiDefinition) => (
          <KPIDefinitionCard key={kpiDefinition.id} kpiDefinition={kpiDefinition} onDelete={handleDelete} />
        ))}
      </Grid>
    </Container>
  )
}
