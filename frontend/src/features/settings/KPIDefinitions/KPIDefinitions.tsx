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
import { useState } from 'react'
import tw from 'tailwind-styled-components'
import { SearchIcon, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  gap: 1.5rem;
  padding: 1.5rem;
  overflow-y: auto;

  @media (min-width: ${breakpoints.sm}) {
    max-width: 1300px;
  }
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

  @media (min-width: ${breakpoints.sm}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: ${breakpoints.md}) {
    grid-template-columns: repeat(3, 1fr);
  }
`

const ClearButton = tw.button`
  absolute right-2 top-1/2 -translate-y-1/2
`

export default function KPIDefinitions() {
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const { t } = useTranslation()

  const { data, loading, refetch, error } = useQuery<KpiDefinitionsQuery, KpiDefinitionsQueryVariables>(
    GET_KPI_DEFINITIONS,
    {
      fetchPolicy: 'cache-first'
    }
  )

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

  const filteredKpiDefinitions =
    data?.kpiDefinitions?.filter((kpiDefinition) =>
      `${kpiDefinition.userIdentifier ?? ''}`.toLowerCase().includes(searchQuery.toLowerCase())
    ) ?? []

  return (
    <PageWrapper>
      <Container>
        <div className="flex items-center justify-between">
          <Heading>{t('settings')}</Heading>
          <Button size={'sm'} variant={'goBack'} onClick={() => navigate('/settings')}>
            &larr; Back to Settings
          </Button>
        </div>

        <Header>
          <Heading as="h2">
            {t('kpiDefinitionsPage.manageKpiDefinitions')}{' '}
            {!loading && data?.kpiDefinitions && (
              <span style={{ fontWeight: '200', fontStyle: 'italic', textWrap: 'nowrap' }}>
                ({t('kpiDefinitionsPage.definitions', { count: data.kpiDefinitions.length })}).
              </span>
            )}
          </Heading>

          <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
            <div className="relative w-full p-1 sm:p-0">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('searchDeviceTypesPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[--color-grey-300] pl-9 sm:w-72"
              />
              {searchQuery && (
                <ClearButton onClick={() => setSearchQuery('')} type="button">
                  <X className="h-5 w-5 text-xl text-[--color-white]" />
                </ClearButton>
              )}
            </div>
            <Button onClick={() => navigate('/settings/kpi-definitions/create')}>+ {t('addNew')}</Button>
          </div>
        </Header>

        {error ? (
          <p>Error: {error.message}</p>
        ) : loading ? (
          <Spinner />
        ) : (
          <Grid>
            {filteredKpiDefinitions.length > 0 ? (
              filteredKpiDefinitions.map((kpiDefinition) => (
                <KPIDefinitionCard key={kpiDefinition.id} kpiDefinition={kpiDefinition} onDelete={handleDelete} />
              ))
            ) : (
              <p>{t('kpiDefinitionsPage.noKpiFound')}</p>
            )}
          </Grid>
        )}
      </Container>
    </PageWrapper>
  )
}
