import { breakpoints } from "@/styles/Breakpoints";
import styled from "styled-components";

const Heading = styled.h1`
  font-size: 1.4rem;
  @media (min-width: ${breakpoints.md}) {
    font-size: 2rem;
  }
  font-weight: 600;
`;

export default Heading;
