import { useDarkMode } from '@/context/DarkModeContext'
import { breakpoints } from '@/styles/Breakpoints'
import styled from 'styled-components'

const StyledLogo = styled.div`
  display: block;
  margin: 0 auto;
`

const Img = styled.img`
  height: 4.8rem;
  width: auto;

  @media (min-width: ${breakpoints.sm}) {
    height: 5.2rem;
  }
`

function Logo({ hideLogo = false }) {
  const { isDarkMode } = useDarkMode()

  const logoColor = isDarkMode ? '/riot-light.svg' : '/riot-dark.svg'

  return <StyledLogo>{!hideLogo && <Img src={logoColor} alt="Logo" />}</StyledLogo>
}

export default Logo
