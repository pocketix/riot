import styled from 'styled-components'
import DarkModeToggle from '../../ui/DarkModeToggle'
import LanguageSwitcher from '../../ui/LanguageSwitcher'
import { breakpoints } from '@/styles/Breakpoints'
import { FaArrowRight } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

const Container = styled.div`
  display: flex;
  flex-direction: column;
`

const SettingsItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-grey-300);
  padding: 0.6rem 0.3rem;

  span {
    font-size: 1rem;
    color: var(--color-grey-900);
  }

  @media (min-width: ${breakpoints.md}) {
    span {
      font-size: 1.3rem;
    }
    &:nth-child(3),
    &:nth-child(4) {
      cursor: pointer;
    }
  }
`

export default function GeneralSettings() {
  const backendCoreURL = process.env.BACKEND_CORE_URL || 'https://tyrion.fit.vutbr.cz/riot/api'

  const navigate = useNavigate()
  const { t } = useTranslation()

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
    <>
      <Container>
        <SettingsItem>
          <span>{t('darkMode')}</span>
          <DarkModeToggle />
        </SettingsItem>
        <SettingsItem>
          <span>{t('language')}</span>
          <LanguageSwitcher />
        </SettingsItem>
        <SettingsItem onClick={() => navigate('/settings/apollo-sandbox')}>
          <span>Developer mode (Apollo Sanxbox)</span>
          <FaArrowRight />
        </SettingsItem>
      </Container>
      <div className="h-full flex justify-center items-end p-4">
        <Button className="w-52" variant={'destructive'} onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </>
  )
}
