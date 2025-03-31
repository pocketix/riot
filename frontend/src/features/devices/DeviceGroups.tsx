import styled from 'styled-components'
import Heading from '@/ui/Heading'
import TabSwitcher from '@/ui/TabSwitcher'
import { useLocation } from 'react-router-dom'
import { breakpoints } from '@/styles/Breakpoints'
import { useTranslation } from 'react-i18next'

const StyledPage = styled.div`
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

export default function DeviceGroups() {
  const location = useLocation()
  const { t } = useTranslation()

  return (
    <StyledPage>
      <div className="flex w-full justify-between">
        <Heading>{t('devices')}</Heading>
        <TabsContainer>
          <TabSwitcher
            activeTab={location.pathname.includes('/devices') ? 'devices' : 'groups'}
            tabs={[
              { name: t('devicesPage.groups'), path: '/groups' },
              { name: t('devicesPage.instances'), path: '/devices' }
            ]}
          />
        </TabsContainer>
      </div>

      {/* Content goes here */}
      <div className="mt-4 text-lg text-[--color-grey-500]">This is the layout for Device Groups</div>
    </StyledPage>
  )
}
