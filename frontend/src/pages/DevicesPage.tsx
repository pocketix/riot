import Heading from '../ui/Heading'
import styled from 'styled-components'
import TabSwitcher from '@/ui/TabSwitcher'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { breakpoints } from '@/styles/Breakpoints'
import { useTranslation } from 'react-i18next'

const StyledPage = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 1.2rem;
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

export default function DevicesPage() {
  const location = useLocation()
  const { t } = useTranslation()

  if (location.pathname === '/devicesPage') {
    return <Navigate to="/devicesPage/groups" replace />
  }

  return (
    <StyledPage>
      <Heading>Devices</Heading>
      <TabsContainer>
        <TabSwitcher
          activeTab={location.pathname.split('/')[2] || 'groups'}
          tabs={[
            { name: t('devicesPage.groups'), path: '/devicesPage/groups' },
            { name: t('devicesPage.instances'), path: '/devicesPage/devices' }
          ]}
        />
      </TabsContainer>
      <Outlet />
    </StyledPage>
  )
}
