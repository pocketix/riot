import { Outlet } from "react-router-dom";
import styled from "styled-components";
import Navbar from "./Navbar";
import { breakpoints } from "@/styles/Breakpoints";

const StyledAppLayout = styled.div`
  position: relative;
  height: 100vh;
  color: var(--color-grey-900);
  display: grid;
  grid-template-rows: 1fr auto;
  grid-template-areas:
    "main"
    "navbar";

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: linear-gradient(
      to bottom,
      var(--primary-background),
      var(--secondary-background)
    );
    opacity: 0.5; /* Adjust transparency */
    z-index: -1;
  }

  @media (min-width: ${breakpoints.md}) {
    grid-template-rows: none;
    grid-template-columns: auto 1fr;
    grid-template-areas: "navbar main";
  }
`;

const Main = styled.main`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow-y: auto;
  grid-area: main;

  @media (min-width: ${breakpoints.md}) {
    align-items: flex-start;
    justify-content: flex-start;
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;

  @media (min-width: ${breakpoints.sm}) {
    max-width: 768px;
  }

  @media (min-width: ${breakpoints.md}) {
    max-width: 1300px;
  }
`;

const StyledNavbar = styled(Navbar)`
  grid-area: navbar;
`;

export default function AppLayout() {
  return (
    <StyledAppLayout>
      <Main>
        <Container>
          <Outlet />
        </Container>
      </Main>
      <StyledNavbar />
    </StyledAppLayout>
  );
}
