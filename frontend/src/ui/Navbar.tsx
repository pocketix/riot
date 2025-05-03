import { AiOutlineHome } from 'react-icons/ai'
import { CiSettings } from 'react-icons/ci'
import { GoPeople } from 'react-icons/go'
import { IoHammerOutline } from 'react-icons/io5'
import { TbDevicesPc } from 'react-icons/tb'
import { NavLink, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import Logo from './Logo'
import { useTranslation } from 'react-i18next'
import { breakpoints } from '@/styles/Breakpoints'
import { useMediaQuery } from 'react-responsive'

const NavbarContainer = styled.div`
  position: fixed;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0.6rem 0.3rem;
  border-top: 2px solid rgba(0, 129, 241, 0.3);
  bottom: 0;
  width: 100%;
  background-color: var(--color-grey-50);
  // Iphone bottom tab switcher
  /* padding-bottom: env(safe-area-inset-bottom, 0); */

  @media (min-width: ${breakpoints.md}) {
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    position: relative;
    border-top: none;
    gap: 0.6rem;
    background-color: transparent;
    padding-bottom: 0;
  }
`

const NavItem = styled(NavLink)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  text-decoration: none;
  color: var(--color-white);
  border-radius: 8px;
  font-size: 0.7rem;
  width: 20%;
  text-align: center;

  &.active {
    color: var(--color-neon-1);
  }

  & svg {
    width: 1.4rem;
    height: 1.4rem;
  }

  &.active svg {
    color: var(--color-neon-1);
  }

  @media (min-width: ${breakpoints.sm}) {
    font-size: 1rem;
  }

  @media (min-width: ${breakpoints.md}) {
    flex-direction: row;
    justify-content: flex-start;
    gap: 1rem;
    width: 220px;
    padding: 0.8rem 2rem;
    font-size: 1rem;
    letter-spacing: 0.05rem;

    &:nth-child(3) {
      order: -1;
    }

    &.active {
      background-color: var(--color-grey-300);
      color: var(--color-white);
      font-weight: 600;
    }
    &:hover {
      background-color: var(--color-grey-300);
    }
    & svg {
      width: 1.5rem;
      height: 1.5rem;
      color: var(--color-grey-400);
    }
  }
`

const StyledNavbar = styled.div`
  display: flex;
  flex-direction: column;

  @media (min-width: ${breakpoints.md}) {
    border-right: 2px solid rgba(0, 129, 241, 0.3);
    height: 100vh;
    padding: 2.4rem 1.2rem;
    gap: 3rem;
  }
`

export default function Navbar() {
  const { t } = useTranslation()
  const location = useLocation()
  const isMobile = useMediaQuery({ maxWidth: parseInt(breakpoints.md) - 1 })
  const isDeviceRoute = location.pathname.startsWith('/devices') || location.pathname.startsWith('/groups')

  return (
    <StyledNavbar>
      <Logo hideLogo={isMobile} />
      <NavbarContainer>
        <NavItem to="/groups" className={isDeviceRoute ? 'active' : ''}>
          <TbDevicesPc />
          <span>{t('devices')}</span>
        </NavItem>
        <NavItem to="/members">
          <GoPeople />
          <span>{t('members')}</span>
        </NavItem>
        <NavItem to="/">
          <AiOutlineHome />
          <span>{t('home')}</span>
        </NavItem>
        <NavItem to="/automations">
          <IoHammerOutline />
          <span>{t('automations')}</span>
        </NavItem>
        <NavItem to="/settings">
          <CiSettings />
          <span>{t('settings')}</span>
        </NavItem>
      </NavbarContainer>
    </StyledNavbar>
  )
}
