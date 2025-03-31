import styled from 'styled-components'
import { useQuery, useMutation } from '@apollo/client'
import { GET_INSTANCES } from '@/graphql/Queries'
import { CONFIRM_SD_INSTANCE } from '@/graphql/Mutations'
import Spinner from '@/ui/Spinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMemo, useState } from 'react'
import DeviceCard from './DeviceCard'
import { ConfirmSdInstanceMutation, ConfirmSdInstanceMutationVariables, SdInstancesQuery } from '@/generated/graphql'
import { breakpoints } from '@/styles/Breakpoints'
import { useSearchParams, useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import tw from 'tailwind-styled-components'
import { useTranslation } from 'react-i18next'
import Heading from '@/ui/Heading'
import TabSwitcher from '@/ui/TabSwitcher'

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 2rem;
  padding: 1.5rem;
  color: hsl(var(--color-white));
  overflow-y: auto;

  @media (min-width: ${breakpoints.sm}) {
    padding: 2rem;
  }
`

const TabsContainer = styled.div`
  @media (min-width: ${breakpoints.sm}) {
    align-self: flex-end;
  }
`

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 1200px;
  align-items: center;

  @media (min-width: ${breakpoints.sm}) {
    align-items: flex-start;
  }
`

const CardGrid = styled.div`
  display: grid;
  gap: 1.5rem;
  width: 100%;
  grid-template-columns: 1fr;

  @media (min-width: ${breakpoints.sm}) {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
`

const SearchWrapper = styled.div`
  position: relative;
  width: 100%;
  max-width: 32rem;
`

const ClearButton = tw.button`
  absolute right-2 top-1/2 -translate-y-1/2
`

export default function Devices() {
  const { t } = useTranslation()
  const location = useLocation()

  const { data, loading, refetch, error } = useQuery<SdInstancesQuery>(GET_INSTANCES)
  const [confirmMutation, { loading: confirming }] = useMutation<
    ConfirmSdInstanceMutation,
    ConfirmSdInstanceMutationVariables
  >(CONFIRM_SD_INSTANCE)

  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search')?.toLowerCase() || ''

  const setSearch = (value: string) => {
    if (value) searchParams.set('search', value)
    else searchParams.delete('search')
    setSearchParams(searchParams)
  }

  const instances = data?.sdInstances || []

  const filteredInstances = useMemo(() => {
    if (!search) return instances
    return instances.filter(
      (i) =>
        i.uid.toLowerCase().includes(search) ||
        i.userIdentifier?.toLowerCase().includes(search) ||
        i.type.denotation.toLowerCase().includes(search)
    )
  }, [instances, search])

  const confirmed = useMemo(() => filteredInstances.filter((i) => i.confirmedByUser), [filteredInstances])
  const unconfirmed = useMemo(() => filteredInstances.filter((i) => !i.confirmedByUser), [filteredInstances])

  const toggleSelection = (id: number, selected: boolean) => {
    setSelectedIds((prev) => (selected ? [...prev, id] : prev.filter((selectedId) => selectedId !== id)))
  }

  const handleBatchConfirm = async () => {
    try {
      await Promise.all(selectedIds.map((id) => confirmMutation({ variables: { id } })))
      await refetch()
      setSelectedIds([])
    } catch (error) {
      console.error('Confirmation failed', error)
    }
  }

  // if (loading) return <Spinner />
  if (error) return <p>Error: {error.message}</p>

  return (
    <PageWrapper>
      {/* Heading + Tabs */}
      <div className="flex w-full justify-between">
        <Heading>{t('devices')}</Heading>
        <TabsContainer>
          <TabSwitcher
            activeTab={location.pathname.split('/')[2] || 'groups'}
            tabs={[
              { name: t('devicesPage.groups'), path: '/groups' },
              { name: t('devicesPage.instances'), path: '/devices' }
            ]}
          />
        </TabsContainer>
      </div>
      {loading ? (
        <Spinner />
      ) : (
        <>
          {/* Search */}
          <Section>
            <SearchWrapper>
              <Input
                placeholder={t('devicesPage.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[--color-grey-200] pr-10"
              />
              {search && (
                <ClearButton onClick={() => setSearch('')} type="button">
                  <X className="h-5 w-5 text-xl text-[--color-white]" />
                </ClearButton>
              )}
            </SearchWrapper>
          </Section>

          {/* Confirmed */}
          <Section>
            <h2 className="w-full text-xl font-bold">{t('devicesPage.confirmedInstances')}</h2>
            <CardGrid>
              {confirmed.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[--color-grey-300] p-6 text-center text-[--color-grey-500]">
                  <p className="text-base font-medium">{t('devicesPage.noConfirmed')}</p>
                </div>
              ) : (
                confirmed.map((instance) => <DeviceCard key={instance.id} instance={instance} confirmed />)
              )}
            </CardGrid>
          </Section>

          {/* Unconfirmed */}
          <Section>
            <div className="flex w-full items-center justify-between">
              <h2 className="text-xl font-bold">{t('devicesPage.unconfirmedInstances')}</h2>
              {selectedIds.length > 0 && (
                <Button onClick={handleBatchConfirm} disabled={confirming}>
                  {t('devicesPage.confirmSelected', { count: selectedIds.length })}
                </Button>
              )}
            </div>
            <CardGrid>
              {unconfirmed.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[--color-grey-300] p-6 text-center text-[--color-grey-500]">
                  <p className="text-base font-medium">{t('devicesPage.noUnconfirmed')}</p>
                </div>
              ) : (
                unconfirmed.map((instance) => (
                  <DeviceCard
                    key={instance.id}
                    instance={instance}
                    confirmed={false}
                    selected={selectedIds.includes(instance.id)}
                    onSelectChange={(selected) => toggleSelection(instance.id, selected)}
                    onConfirmClick={async () => {
                      await confirmMutation({ variables: { id: instance.id } })
                      await refetch()
                    }}
                  />
                ))
              )}
            </CardGrid>
          </Section>
        </>
      )}
    </PageWrapper>
  )
}
