import styled from "styled-components";
import { breakpoints } from "../styles/GlobalStyles";

const StyledLogo = styled.div`
  text-align: center;
  display: none;
  @media (min-width: ${breakpoints.md}) {
    display: block;
  }
`;

const Img = styled.img`
  height: 9.6rem;
  width: auto;
`;

function Logo() {
  return (
    <StyledLogo>
      <Img src="/vite.svg" alt="Logo" />
    </StyledLogo>
  );
}

export default Logo;
