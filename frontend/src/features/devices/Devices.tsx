import styled from 'styled-components'
import { useQuery, useMutation } from '@apollo/client'
import { GET_INSTANCES } from '@/graphql/Queries'
import { CONFIRM_SD_INSTANCE } from '@/graphql/Mutations'
import Spinner from '@/ui/Spinner'
import { Button } from '@/components/ui/button'
import { useMemo, useState } from 'react'
import DeviceCard from './DeviceCard'
import { ConfirmSdInstanceMutation, ConfirmSdInstanceMutationVariables, SdInstancesQuery } from '@/generated/graphql'
import { breakpoints } from '@/styles/Breakpoints'

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  height: max-content;
  align-items: center;

  @media (min-width: ${breakpoints.sm}) {
    padding: 2rem;
    align-items: flex-start;
    height: 100%;
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

export default function Devices() {
  const { data, loading, refetch } = useQuery<SdInstancesQuery>(GET_INSTANCES)
  const [confirmSdInstanceMutation, { loading: confirming }] = useMutation<
    ConfirmSdInstanceMutation,
    ConfirmSdInstanceMutationVariables
  >(CONFIRM_SD_INSTANCE)

  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const instances = data?.sdInstances || []
  const confirmed = useMemo(() => instances.filter((i) => i.confirmedByUser), [instances])
  const unconfirmed = useMemo(() => instances.filter((i) => !i.confirmedByUser), [instances])

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

  return (
    <PageContainer>
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
