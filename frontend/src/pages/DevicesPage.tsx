import Heading from '../ui/Heading'
import styled from 'styled-components'
import TabSwitcher from '@/ui/TabSwitcher'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { breakpoints } from '@/styles/Breakpoints'

const StyledPage = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 1.2rem;
  padding: 2rem;
  color: hsl(var(--color-white));
  overflow: hidden;
`

const TabsContainer = styled.div`
  @media (min-width: ${breakpoints.sm}) {
    align-self: flex-end;
  }
`

export default function DevicesPage() {
  const location = useLocation()

  if (location.pathname === '/devicesPage') {
    return <Navigate to="/devicesPage/devices" replace />
  }

  return (
    <StyledPage>
      <Heading>Devices</Heading>
      <TabsContainer>
        <TabSwitcher
          activeTab={location.pathname.split('/')[2] || 'devices'}
          tabs={[
            { name: 'Devices', path: '/devicesPage/devices' },
            { name: 'Groups', path: '/devicesPage/groups' }
          ]}
        />
      </TabsContainer>
      <Outlet />
    </StyledPage>
  )
}
