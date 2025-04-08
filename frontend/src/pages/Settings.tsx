import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Heading from '../ui/Heading'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { breakpoints } from '@/styles/Breakpoints'
import DarkModeToggle from '@/ui/DarkModeToggle'
import LanguageSwitcher from '@/ui/LanguageSwitcher'
import { FaArrowRight } from 'react-icons/fa'
import UserAccountDetail from '@/features/settings/PersonalInfo/UserAccountDetail'

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const StyledPage = styled.div`
  display: flex;
  flex-direction: column;
  color: hsl(var(--color-grey-900));
  overflow: hidden;
  gap: 1.5rem;
  overflow-y: auto;
  width: 100%;
  height: 100%;
  align-self: center;
  padding: 1.5rem;

  @media (min-width: ${breakpoints.sm}) {
    max-width: 1300px;
  }
`
const SettingsSectionHeader = styled.div`
  font-weight: 600;
  font-size: 1.2rem;
  border-bottom: 1px solid var(--color-grey-300);

  @media (min-width: ${breakpoints.md}) {
    font-size: 1.4rem;
  }
`

const SettingsItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* border-bottom: 1px solid var(--color-grey-300); */
  height: 3.2rem;
  padding: 0.6rem;

  span {
    font-size: 1rem;
    color: var(--color-grey-900);
  }

  @media (min-width: ${breakpoints.md}) {
    span {
      font-size: 1.2rem;
    }
  }
`
const SettingsSection = styled.div`
  height: max-content;
`

export default function Settings() {
  const backendCoreURL = process.env.BACKEND_CORE_URL || 'https://tyrion.fit.vutbr.cz/riot/api'

  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await fetch(`${backendCoreURL}/auth/logout`, {
        method: 'GET',
        credentials: 'include'
      })

      // Redirect to login page after successful logout
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <PageWrapper>
      <StyledPage>
        <Heading>{t('settings')}</Heading>
        <SettingsSection>
          <UserAccountDetail />
        </SettingsSection>
        <SettingsSection>
          <SettingsSectionHeader>General</SettingsSectionHeader>
          <SettingsItem>
            <span>{t('darkMode')}</span>
            <DarkModeToggle />
          </SettingsItem>
          <SettingsItem>
            <span>{t('language')}</span>
            <LanguageSwitcher />
          </SettingsItem>

          <SettingsItem className="cursor-pointer" onClick={() => navigate('/settings/device-types')}>
            <span>Manage your Device Types</span>
            <FaArrowRight />
          </SettingsItem>
          <SettingsItem className="cursor-pointer" onClick={() => navigate('/settings/kpi-definitions')}>
            <span>Manage your KPI Definitions</span>
            <FaArrowRight />
          </SettingsItem>
        </SettingsSection>

        <SettingsSection>
          <SettingsSectionHeader>Developer settings</SettingsSectionHeader>
          <SettingsItem className="cursor-pointer" onClick={() => navigate('/settings/apollo-sandbox')}>
            <span>{t('developerMode')} (Apollo Sanxbox)</span>
            <FaArrowRight />
          </SettingsItem>
        </SettingsSection>
        <div className="flex h-max items-end justify-center p-4">
          <Button className="w-52" variant={'destructive'} onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </StyledPage>
    </PageWrapper>
  )
}
