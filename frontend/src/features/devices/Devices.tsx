import styled from 'styled-components'
import { useQuery, useMutation } from '@apollo/client'
import { GET_INSTANCES } from '@/graphql/Queries'
import { CONFIRM_SD_INSTANCE, CREATE_SD_INSTANCE_GROUP } from '@/graphql/Mutations'
import Spinner from '@/ui/Spinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMemo, useState } from 'react'
import DeviceCard from './DeviceCard'
import { ConfirmSdInstanceMutation, ConfirmSdInstanceMutationVariables, SdInstancesQuery } from '@/generated/graphql'
import { breakpoints } from '@/styles/Breakpoints'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SearchIcon, X } from 'lucide-react'
import tw from 'tailwind-styled-components'
import { useTranslation } from 'react-i18next'
import Heading from '@/ui/Heading'
import { useSubscription } from '@apollo/client'
import { ON_SD_INSTANCE_REGISTERED } from '@/graphql/Subscriptions'
import Tabs from '@/ui/Tabs'
import CreateGroupModal from '@/ui/CreateGroupModal'

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-grow: 1;
  gap: 1rem;
  padding: 1.5rem;
  color: hsl(var(--color-white));
  width: 100%;
  height: 100%;

  @media (min-width: ${breakpoints.sm}) {
    max-width: 1300px;
  }
`

const TopBar = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  max-width: 1300px;
  gap: 1rem;
`

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 1300px;
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

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-align: center;
  padding: 1.5rem;
  border: 2px dashed var(--color-grey-300);
  border-radius: 0.5rem;
  color: var(--color-grey-500);
  font-size: 1rem;
  grid-column: span 4;
`

const ClearButton = tw.button`
  absolute right-2 top-1/2 -translate-y-1/2
`

export default function Devices() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const isMobile = window.innerWidth < Number(breakpoints.sm.replace('px', ''))

  const { data, loading, refetch, error } = useQuery<SdInstancesQuery>(GET_INSTANCES)

  useSubscription(ON_SD_INSTANCE_REGISTERED, {
    onData: ({ data }) => {
      console.log(data)
      refetch()
    }
  })

  const [confirmMutation, { loading: confirming }] = useMutation<
    ConfirmSdInstanceMutation,
    ConfirmSdInstanceMutationVariables
  >(CONFIRM_SD_INSTANCE)

  const [createSDInstanceGroupMutation, { loading: creatingGroup }] = useMutation(CREATE_SD_INSTANCE_GROUP)

  const [selectedIdsConfirm, setSelectedIdsConfirm] = useState<number[]>([])
  const [selectedIdsGroups, setSelectedIdsGroups] = useState<number[]>([])
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search')?.toLowerCase() || ''
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)

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

  const toggleSelectionConfirm = (id: number, selected: boolean) => {
    setSelectedIdsConfirm((prev) => (selected ? [...prev, id] : prev.filter((selectedId) => selectedId !== id)))
  }
  const toggleSelectionGroups = (id: number, selected: boolean) => {
    setSelectedIdsGroups((prev) => (selected ? [...prev, id] : prev.filter((selectedId) => selectedId !== id)))
  }

  const handleBatchConfirm = async () => {
    try {
      await Promise.all(selectedIdsConfirm.map((id) => confirmMutation({ variables: { id } })))
      await refetch()
      setSelectedIdsConfirm([])
    } catch (error) {
      console.error('Confirmation failed', error)
    }
  }

  const handleCreateGroup = async (identifier: string) => {
    console.log('Creating group with selected devices:', selectedIdsGroups)
    const { data } = await createSDInstanceGroupMutation({
      variables: {
        input: {
          sdInstanceIDs: selectedIdsGroups,
          userIdentifier: identifier
        }
      }
    })
    console.log(data)
    await refetch()
    setSelectedIdsGroups([])
    setIsGroupModalOpen(false)
    navigate(`/group/${data.createSDInstanceGroup.id}`)
  }

  return (
    <PageWrapper>
      <Container>
        <TopBar>
          {!isMobile && <Heading>Device Instances</Heading>}
          <Tabs
            tabs={[
              { name: t('devicesPage.groups'), path: '/groups' },
              { name: t('devicesPage.instances'), path: '/devices' }
            ]}
          />
        </TopBar>

        <Section>
          <SearchWrapper>
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('devicesPage.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[--color-grey-200] pl-9 pr-10 text-sm md:text-base"
            />
            {search && (
              <ClearButton onClick={() => setSearch('')} type="button">
                <X className="h-5 w-5 text-xl text-[--color-white]" />
              </ClearButton>
            )}
          </SearchWrapper>
        </Section>

        {loading && <Spinner />}

        {error && (
          <Section>
            <EmptyState>
              <p className="text-center text-lg font-semibold">Error: {error.message}</p>
            </EmptyState>
          </Section>
        )}

        {!loading && !error && (
          <>
            <Section>
              <div className="flex h-10 w-full items-center justify-between gap-4">
                <h2 className="text-xl font-bold">
                  {t('devicesPage.confirmedInstances')}{' '}
                  <span style={{ fontWeight: '300', fontStyle: 'italic', textWrap: 'nowrap' }}>
                    ({confirmed.length})
                  </span>
                </h2>
                {selectedIdsGroups.length > 0 && (
                  <Button
                    size={isMobile ? 'sm' : undefined}
                    onClick={() => setIsGroupModalOpen(true)}
                    disabled={creatingGroup}
                  >
                    {t('devicesPage.createSelectedGroups', { count: selectedIdsGroups.length })}
                  </Button>
                )}
              </div>
              <CardGrid>
                {confirmed.length === 0 ? (
                  <EmptyState>{t('devicesPage.noConfirmed')}</EmptyState>
                ) : (
                  confirmed.map((instance) => (
                    <DeviceCard
                      key={instance.id}
                      instance={instance}
                      selectedConfirm={selectedIdsGroups.includes(instance.id)}
                      onSelectChange={(selected) => toggleSelectionGroups(instance.id, selected)}
                      confirmed={false}
                    />
                  ))
                )}
              </CardGrid>
            </Section>

            <Section>
              <div className="flex w-full items-center justify-between">
                <h2 className="text-xl font-bold">
                  {t('devicesPage.unconfirmedInstances')}{' '}
                  {unconfirmed.length !== 0 && (
                    <span style={{ fontWeight: '300', fontStyle: 'italic', textWrap: 'nowrap' }}>
                      ({unconfirmed.length})
                    </span>
                  )}
                </h2>
                {selectedIdsConfirm.length > 0 && (
                  <Button size={isMobile ? 'sm' : undefined} onClick={handleBatchConfirm} disabled={confirming}>
                    {t('devicesPage.confirmSelected', { count: selectedIdsConfirm.length })}
                  </Button>
                )}
              </div>
              <CardGrid>
                {unconfirmed.length === 0 ? (
                  <EmptyState>{t('devicesPage.noUnconfirmed')}</EmptyState>
                ) : (
                  unconfirmed.map((instance) => (
                    <DeviceCard
                      key={instance.id}
                      instance={instance}
                      confirmed={false}
                      selectedConfirm={selectedIdsConfirm.includes(instance.id)}
                      onSelectChange={(selected) => toggleSelectionConfirm(instance.id, selected)}
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
      </Container>
      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onConfirm={handleCreateGroup}
        selectedDeviceNames={confirmed
          .filter((i) => selectedIdsGroups.includes(i.id))
          .map((i) => i.userIdentifier || i.uid)}
      />
    </PageWrapper>
  )
}
