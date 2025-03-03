import { FaToggleOff, FaToggleOn } from "react-icons/fa";
import { useDarkMode } from "../context/DarkModeContext";
import styled from "styled-components";

const ToggleButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-white);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 3rem;
`;

export default function DarkModeToggle() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <ToggleButton onClick={toggleDarkMode}>
      {isDarkMode ? <FaToggleOn /> : <FaToggleOff />}
    </ToggleButton>
  );
}
