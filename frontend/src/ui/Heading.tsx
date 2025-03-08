import { breakpoints } from "@/styles/Breakpoints";
import styled from "styled-components";

interface HeadingProps {
  variant?: "h1" | "h2";
}

const Heading = styled.h1<HeadingProps>`
  font-size: ${({ variant }) => (variant === "h2" ? "1.2rem" : "1.4rem")};
  font-weight: 600;

  @media (min-width: ${breakpoints.md}) {
    font-size: ${({ variant }) => (variant === "h2" ? "1.6rem" : "2rem")};
  }
`;

export default Heading;
