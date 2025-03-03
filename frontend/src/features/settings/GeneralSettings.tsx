import styled from "styled-components";
import DarkModeToggle from "../../ui/DarkModeToggle";
import LanguageSwitcher from "../../ui/LanguageSwitcher";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const SettingsItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  span {
    font-size: 1.8rem;
    color: var(--color-grey-900);
  }
`;

export default function GeneralSettings() {
  return (
    <Container>
      <SettingsItem>
        <span>Use dark mode</span>
        <DarkModeToggle />
      </SettingsItem>
      <SettingsItem>
        <span>Language</span>
        <LanguageSwitcher />
      </SettingsItem>
      <SettingsItem>
        <span>Developer mode</span>
      </SettingsItem>
    </Container>
  );
}
