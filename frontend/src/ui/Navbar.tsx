import { AiOutlineHome } from "react-icons/ai";
import { CiSettings } from "react-icons/ci";
import { GoPeople } from "react-icons/go";
import { IoHammerOutline } from "react-icons/io5";
import { TbDevicesPc } from "react-icons/tb";
import { NavLink } from "react-router-dom";
import styled from "styled-components";
import Logo from "./Logo";
import { useTranslation } from "react-i18next";
import { breakpoints } from "@/styles/Breakpoints";

const NavbarContainer = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0.6rem 0.3rem;
  border-top: 2px solid rgba(0, 129, 241, 0.3);
  position: relative;
  bottom: 0;
  width: 100%;

  @media (min-width: ${breakpoints.md}) {
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    position: relative;
    border-top: none;
    gap: 0.6rem;
  }
`;

const NavItem = styled(NavLink)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  text-decoration: none;
  color: var(--color-white);
  border-radius: 8px;
  font-size: 0.7rem;
  width: 20%;
  text-align: center;

  &.active {
    color: var(--color-neon-1);
  }

  & svg {
    margin-bottom: 0.4rem;
    width: 1.4rem;
    height: 1.4rem;
  }

  @media (min-width: ${breakpoints.sm}) {
    font-size: 1rem;
  }

  @media (min-width: ${breakpoints.md}) {
    flex-direction: row;
    justify-content: flex-start;
    gap: 1rem;
    width: 250px;
    padding: 0.6rem 2.4rem;
    transition: all 0.3s ease-in-out;
    font-size: 1rem;
    letter-spacing: 0.1rem;
    margin-right: 1.2rem;

    &:nth-child(3) {
      order: -1;
    }

    &.active {
      background-color: rgba(255, 255, 255, 0.1);
    }
    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }
`;

const StyledNavbar = styled.div`
  display: flex;
  flex-direction: column;
  background-color: var(--secondary);

  @media (min-width: ${breakpoints.md}) {
    border-right: 2px solid rgba(0, 129, 241, 0.3);
    height: 100vh;
    padding: 2.4rem 1.2rem;
    gap: 3rem;
  }
`;

export default function Navbar() {
  const { t } = useTranslation();
  return (
    <StyledNavbar>
      <Logo />
      <NavbarContainer>
        <NavItem to="/devices">
          <TbDevicesPc />
          <span>{t("devices")}</span>
        </NavItem>
        <NavItem to="/members">
          <GoPeople />
          <span>{t("members")}</span>
        </NavItem>
        <NavItem to="/">
          <AiOutlineHome />
          <span>{t("home")}</span>
        </NavItem>
        <NavItem to="/automations">
          <IoHammerOutline />
          <span>{t("automations")}</span>
        </NavItem>
        <NavItem to="/settings">
          <CiSettings />
          <span>{t("settings")}</span>
        </NavItem>
      </NavbarContainer>
    </StyledNavbar>
  );
}
