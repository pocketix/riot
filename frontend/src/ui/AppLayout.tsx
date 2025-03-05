import { Outlet } from "react-router-dom";
import styled from "styled-components";
import Navbar from "./Navbar";
import { breakpoints } from "@/styles/Breakpoints";

const StyledAppLayout = styled.div`
  height: 100vh;
  background-image: linear-gradient(
    to bottom,
    hsl(var(--primary-background)),
    hsl(var(--secondary-background))
  );
  background-color: hsl(var(--primary-background));
  color: hsl(var(--color-grey-900));
  display: grid;
  grid-template-rows: 1fr auto;
  grid-template-areas:
    "main"
    "navbar";

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
    /* padding: 6rem 4rem; */
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

  @media (min-width: ${breakpoints.md}) {
    max-width: 100%;
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
