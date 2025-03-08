import { useDarkMode } from "@/context/DarkModeContext";
import { breakpoints } from "@/styles/Breakpoints";
import { useMediaQuery } from "react-responsive";
import styled from "styled-components";

const StyledLogo = styled.div`
  display: none;
  margin: 0 auto;
  @media (min-width: ${breakpoints.md}) {
    display: block;
  }
`;

const Img = styled.img`
  height: 5.2rem;
  width: auto;
`;

function Logo() {
  const { isDarkMode } = useDarkMode();
  const isMobile = useMediaQuery({ maxWidth: parseInt(breakpoints.sm) - 1 });

  const logo = isMobile
    ? "/riot-phone.svg"
    : isDarkMode
    ? "/riot-light.svg"
    : "/riot-dark.svg";

  return <StyledLogo>{logo && <Img src={logo} alt="Logo" />}</StyledLogo>;
}

export default Logo;
