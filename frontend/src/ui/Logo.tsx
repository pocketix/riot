import styled from 'styled-components'
import RiotLight from './Logos/RiotLight'
import RiotDark from './Logos/RiotDark'
import { useDarkMode } from '@/context/DarkModeContext'

const LogoWrapper = styled.div`
  width: 12rem;
  margin: 0 auto;
  height: auto;

  svg {
    width: 100%;
    height: auto;
  }
`

export default function Logo({ hideLogo = false }) {
  const { isDarkMode } = useDarkMode()
  const LogoSvg = isDarkMode ? RiotLight : RiotDark

  return (
    !hideLogo && (
      <LogoWrapper>
        <LogoSvg />
      </LogoWrapper>
    )
  )
}
