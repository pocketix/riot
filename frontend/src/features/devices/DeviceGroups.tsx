import styled from 'styled-components'
import Heading from '@/ui/Heading'
import { breakpoints } from '@/styles/Breakpoints'
import { useTranslation } from 'react-i18next'
import { GroupPageController } from '@/controllers/GroupPageController'
import Tabs from '@/ui/Tabs'

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
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

export default function DeviceGroups() {
  const { t } = useTranslation()
  const isMobile = window.innerWidth < Number(breakpoints.sm.replace('px', ''))

  return (
    <PageWrapper>
      <Container>
        <TopBar>
          {!isMobile && <Heading>Devices Groups</Heading>}
          <Tabs
            tabs={[
              { name: t('devicesPage.groups'), path: '/groups' },
              { name: t('devicesPage.instances'), path: '/devices' }
            ]}
          />
        </TopBar>

        <div className="text-lg text-[--color-grey-500]">
          <GroupPageController />
        </div>
      </Container>
    </PageWrapper>
  )
}
