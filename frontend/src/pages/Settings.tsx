import styled from "styled-components";
import Heading from "../ui/Heading";
import TabSwitcher from "../ui/TabSwitcher";
import { useState } from "react";

import GeneralSettings from "../features/settings/GeneralSettings";
import PersonalInfoSettings from "../features/settings/PersonalInfoSettings";
import DeviceTypesSettings from "../features/settings/DeviceTypesSettings";
import { useTranslation } from "react-i18next";

const StyledPage = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  padding: 2rem;
  color: hsl(var(--color-grey-900));
  overflow: hidden;
  gap: 1.2rem;
`;

const SettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  gap: 2rem;
`;

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const { t } = useTranslation();

  // Map active tab to components
  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return <GeneralSettings />;
      case "personal info":
        return <PersonalInfoSettings />;
      case "device types":
        return <DeviceTypesSettings />;
      default:
        return null;
    }
  };

  return (
    <StyledPage>
      <Heading>{t("settings")}</Heading>
      <TabSwitcher
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={["general", "personal info", "device types"]}
      />
      <SettingsContainer>{renderTabContent()}</SettingsContainer>
    </StyledPage>
  );
}
