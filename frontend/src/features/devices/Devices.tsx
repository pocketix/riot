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
import { useSearchParams } from 'react-router-dom'
import { X } from 'lucide-react'
import tw from 'tailwind-styled-components'

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  height: max-content;
  align-items: center;

  @media (min-width: ${breakpoints.sm}) {
    padding: 2rem;
    align-items: flex-start;
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
  const { data, loading, refetch, error } = useQuery<SdInstancesQuery>(GET_INSTANCES)
  const [confirmSdInstanceMutation, { loading: confirming }] = useMutation<
    ConfirmSdInstanceMutation,
    ConfirmSdInstanceMutationVariables
  >(CONFIRM_SD_INSTANCE)

  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search')?.toLowerCase() || ''

  const setSearch = (value: string) => {
    if (value) {
      searchParams.set('search', value)
    } else {
      searchParams.delete('search')
    }
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
      await Promise.all(selectedIds.map((id) => confirmSdInstanceMutation({ variables: { id } })))
      await refetch()
      setSelectedIds([])
    } catch (error) {
      console.error('Confirmation failed', error)
    }
  }

  if (loading) return <Spinner />
  if (error) return <p>Error: {error.message}</p>

  return (
    <PageContainer>
      <Section>
        <SearchWrapper>
          <Input
            placeholder="Search by UID, User Identifier, or Type..."
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

      <Section>
        <h2 className="w-full text-xl font-bold">Confirmed Instances</h2>
        <CardGrid>
          {confirmed.map((instance) => (
            <DeviceCard key={instance.id} instance={instance} confirmed={true} />
          ))}
        </CardGrid>
      </Section>

      <Section>
        <div className="flex w-full items-center justify-between">
          <h2 className="text-xl font-bold">Unconfirmed Instances</h2>
          {selectedIds.length > 0 && (
            <Button onClick={handleBatchConfirm} disabled={confirming}>
              Confirm Selected ({selectedIds.length})
            </Button>
          )}
        </div>
        <CardGrid>
          {unconfirmed.map((instance) => (
            <DeviceCard
              key={instance.id}
              instance={instance}
              confirmed={false}
              selected={selectedIds.includes(instance.id)}
              onSelectChange={(selected) => toggleSelection(instance.id, selected)}
              onConfirmClick={async () => {
                await confirmSdInstanceMutation({ variables: { id: instance.id } })
                await refetch()
              }}
            />
          ))}
        </CardGrid>
      </Section>
    </PageContainer>
  )
}
