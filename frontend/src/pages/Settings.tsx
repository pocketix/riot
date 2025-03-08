import { Navigate, Outlet, useLocation } from "react-router-dom";
import styled from "styled-components";
import Heading from "../ui/Heading";
import TabSwitcher from "../ui/TabSwitcher";
import { useTranslation } from "react-i18next";

const StyledPage = styled.div`
  display: flex;
  flex-direction: column;
  padding: 2rem;
  color: hsl(var(--color-grey-900));
  overflow: hidden;
  gap: 1.2rem;
  overflow-y: auto;
  width: 100%;
  height: 100%;
  align-self: center;
  max-width: 1300px;
`;

export default function Settings() {
  const { t } = useTranslation();
  const location = useLocation();

  // If user is on /settings, redirect to /settings/general
  if (location.pathname === "/settings") {
    return <Navigate to="/settings/general" replace />;
  }

  return (
    <StyledPage>
      <Heading>{t("settings")}</Heading>
      <TabSwitcher
        activeTab={location.pathname.split("/").pop() || "general"}
        tabs={[
          { name: "general", path: "/settings/general" },
          { name: "personal info", path: "/settings/personal-info" },
          { name: "device types", path: "/settings/device-types" },
        ]}
      />
      <Outlet />
    </StyledPage>
  );
}
