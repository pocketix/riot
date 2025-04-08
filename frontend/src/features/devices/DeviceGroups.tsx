import styled from 'styled-components'
import Heading from '@/ui/Heading'
import TabSwitcher from '@/ui/TabSwitcher'
import { useLocation } from 'react-router-dom'
import { breakpoints } from '@/styles/Breakpoints'
import { useTranslation } from 'react-i18next'
import { GroupPageController } from '@/controllers/GroupPageController'

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const Container = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  overflow-y: auto;

  @media (min-width: ${breakpoints.sm}) {
    max-width: 1300px;
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
    <PageWrapper>
      <Container>
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
        <div className="mt-4 text-lg text-[--color-grey-500]">
          <GroupPageController />
        </div>
      </Container>
    </PageWrapper>
  )
}
