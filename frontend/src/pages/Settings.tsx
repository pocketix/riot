import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Heading from '../ui/Heading'
import TabSwitcher from '../ui/TabSwitcher'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { breakpoints } from '@/styles/Breakpoints'

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
`

const StyledPage = styled.div`
  display: flex;
  flex-direction: column;
  color: hsl(var(--color-grey-900));
  overflow: hidden;
  gap: 1.2rem;
  overflow-y: auto;
  width: 100%;
  height: 100%;
  align-self: center;

  @media (min-width: ${breakpoints.sm}) {
    max-width: 1300px;
  }
`

const NavigationDiv = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  @media (min-width: ${breakpoints.sm}) {
    display: flex;
  }
`

export default function Settings() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  // If user is on /settings, redirect to /settings/general
  if (location.pathname === '/settings') {
    return <Navigate to="/settings/general" replace />
  }

  const isDefaultTab =
    location.pathname === '/settings/general' ||
    location.pathname === '/settings/personal-info' ||
    location.pathname === '/settings/device-types' ||
    location.pathname === '/settings/kpi-definitions'

  const isMobile = window.innerWidth < Number(breakpoints.sm.replace('px', ''))

  return (
    <PageWrapper>
      <StyledPage>
        <Heading>{t('settings')}</Heading>

        {(isDefaultTab || !isMobile) && (
          <NavigationDiv>
            <TabSwitcher
              activeTab={location.pathname.split('/')[2] || 'general'}
              tabs={[
                { name: t('general'), path: '/settings/general' },
                { name: t('personalInfo'), path: '/settings/personal-info' },
                { name: t('deviceTypes'), path: '/settings/device-types' },
                { name: t('kpiDefinitions'), path: '/settings/kpi-definitions' }
              ]}
            />
            {!isMobile && !isDefaultTab && (
              <Button onClick={() => navigate('/settings/device-types')}>&larr; {t('goBack')}</Button>
            )}
          </NavigationDiv>
        )}
        <Outlet />
      </StyledPage>
    </PageWrapper>
  )
}
