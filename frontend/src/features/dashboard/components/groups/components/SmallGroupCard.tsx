import styled from 'styled-components'
import { RiAlertFill } from 'react-icons/ri'
import { Separator } from '@/components/ui/separator'
import { GroupModalDetailView } from '../GroupModalDetailView'
import { useState, useMemo } from 'react'
import { GroupDetailWithKPIs } from '@/controllers/details/GroupDetailPageController'
import '@/index.css'

interface SmallGroupCardProps {
  group: GroupDetailWithKPIs
}

const SmallGroupCardContainer = styled.div<{ hasFailingKPIs: boolean }>`
  position: relative;
  border: ${({ hasFailingKPIs }) => (hasFailingKPIs ? '2px' : '1px')} solid ${({ hasFailingKPIs }) => (hasFailingKPIs ? 'red' : 'green')};
  border-radius: 8px;
  max-width: 200px;
  padding: 4px 8px;
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  justify-items: center;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: row;
  }
`

const CardOverlay = styled.div<{ failed: number; total: number }>`
  position: absolute;
  top: 0;
  left: 0;
  width: ${({ failed, total }) => (failed / total) * 100}%;
  height: 100%;
  background-color: hsl(var(--destructive) / 0.8);
  z-index: -1;
`

export const SmallGroupCard = ({ group }: SmallGroupCardProps) => {
  const { notFulfilled: numberOfFailedKPIs } = group.kpiStats

  const devicesWithFailingKPIs = useMemo(() => {
    return group.instances.filter(instance => instance.kpiStats.notFulfilled > 0);
  }, [group.instances])

  const numberOfDevices = group.instances.length
  const [detailsOpen, setDetailsOpen] = useState(false)

  const hasFailingKPIs = numberOfFailedKPIs > 0

  return (
    <>
      <SmallGroupCardContainer hasFailingKPIs={hasFailingKPIs} onClick={() => setDetailsOpen(true)}>
        <CardOverlay failed={devicesWithFailingKPIs.length} total={numberOfDevices} />
        {hasFailingKPIs && (
          <span className="flex items-center truncate break-all font-semibold">
            {numberOfFailedKPIs}
            <RiAlertFill className="ml-1 inline-block text-red-700" />
          </span>
        )}
        {hasFailingKPIs && (
          <>
            <Separator className="mx-2 block md:hidden" orientation="vertical" />
            <Separator className="hidden md:block" orientation="horizontal" />
          </>
        )}
        <span className="text-sm">{group.userIdentifier}</span>
      </SmallGroupCardContainer>
      <GroupModalDetailView
        group={group}
        open={detailsOpen}
        setOpen={setDetailsOpen}
      />
    </>
  )
}