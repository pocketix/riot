import { useTranslation } from "react-i18next";
import styled from "styled-components";

const Select = styled.select`
  padding: 0.5rem;
  font-size: 1.1rem;
  border: 1px solid hsl(var(--color-grey-300));
  border-radius: 8px;
  background: hsl(var(--color-grey-100));
  color: hsl(var(--color-grey-900));
  cursor: pointer;
  text-transform: capitalize;

  &:focus {
    outline: none;
    border-color: hsl(var(--color-grey-500));
  }
`;

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = event.target.value;
    i18n.changeLanguage(newLanguage);
    localStorage.setItem("language", newLanguage); // Save selection
  };

  return (
    <Select value={i18n.language} onChange={changeLanguage}>
      <option value="en">English</option>
      <option value="cz">Čeština</option>
    </Select>
  );
}
