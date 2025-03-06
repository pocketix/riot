import { breakpoints } from "@/styles/Breakpoints";
import styled from "styled-components";

const StyledLogo = styled.div`
  display: none;
  margin: 0 auto;
  @media (min-width: ${breakpoints.md}) {
    display: block;
  }
`;

const Img = styled.img`
  height: 6.6rem;
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
