import styled from 'styled-components'
import { KPIGroup } from '../GroupsController'
import { RiAlertFill } from 'react-icons/ri'
import { Separator } from '@/components/ui/separator'
import '@/index.css'
import { GroupDetail } from '../../details/groups/GroupDetail'
import { useState } from 'react'

interface GroupCardProps {
  group: KPIGroup
}

export interface DeviceWithFailingKPIs {
  instance: KPIGroup['instances'][0]
  failingKPIs: Array<KPIGroup['KPIdefinitions'][0]>
}

const GroupCardContainer = styled.div<{ fulfilled: boolean }>`
  position: relative;
  border: ${({ fulfilled }) => (fulfilled ? '2px' : '1px')} solid ${({ fulfilled }) => (fulfilled ? 'red' : 'green')};
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

const CardOverlay = styled.div<{ fulfilled: number; total: number }>`
  position: absolute;
  top: 0;
  left: 0;
  width: ${({ fulfilled, total }) => (fulfilled / total) * 100}%;
  height: 100%;
  background-color: hsl(var(--destructive) / 0.8);
  z-index: -1;
`

export const GroupCard = ({ group }: GroupCardProps) => {
  const numberOfFullfilledKPIs = group.KPIfulfillments.filter((fulfillment) => fulfillment.fulfilled === true).length
  const totalNumberOfKPIs = group.KPIfulfillments.length

  const devicesWithFailingKPIs: DeviceWithFailingKPIs[] = group.instances
    .map((instance) => {
      const failingFulfillments = group.KPIfulfillments.filter(
        (fulfillment) => fulfillment.sdInstanceID === instance.id && fulfillment.fulfilled === true
      )

      const failingKPIs = failingFulfillments
        .map((fulfillment) => group.KPIdefinitions.find((kpi) => kpi.id === fulfillment.kpiDefinitionID))
        .filter(Boolean) as KPIGroup['KPIdefinitions']

      return {
        instance,
        failingKPIs
      }
    })
    .filter((item) => item.failingKPIs.length > 0)

  const numberOfDevices = group.instances.length

  const [detailsOpen, setDetailsOpen] = useState(false)

  return (
    <>
      <GroupCardContainer fulfilled={devicesWithFailingKPIs.length > 0} onClick={() => setDetailsOpen(true)}>
        <CardOverlay fulfilled={devicesWithFailingKPIs ? devicesWithFailingKPIs.length : 0} total={numberOfDevices} />
        {numberOfFullfilledKPIs > 0 && (
          <span className="flex items-center truncate break-all font-semibold">
            {numberOfFullfilledKPIs}
            <RiAlertFill className="ml-1 inline-block text-red-700" />
          </span>
        )}
        {numberOfFullfilledKPIs > 0 && (
          <>
            <Separator className="mx-2 block md:hidden" orientation="vertical" />
            <Separator className="hidden md:block" orientation="horizontal" />
          </>
        )}
        <span className="text-sm">{group.userIdentifier}</span>
      </GroupCardContainer>
      <GroupDetail
        failingDevices={devicesWithFailingKPIs}
        group={group}
        fullFilledKPIs={numberOfFullfilledKPIs}
        totalKPIs={totalNumberOfKPIs}
        open={detailsOpen}
        setOpen={setDetailsOpen}
      />
    </>
  )
}
