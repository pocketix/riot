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
  let logo;
  if (isMobile) {
    logo = "riot-phone.svg";
  } else {
    isDarkMode ? (logo = "riot-light.svg") : (logo = "riot-dark.svg");
  }

  return (
    <StyledLogo>
      <Img src={logo} alt="Logo" />
    </StyledLogo>
  );
}

export default Logo;
