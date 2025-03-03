import styled from "styled-components";
import { breakpoints } from "../styles/GlobalStyles";

const TabsContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  width: 100%;
  backdrop-filter: blur(12px);
  margin-bottom: 1.5rem;

  @media (min-width: 768px) {
    width: max-content;
    align-self: flex-start;
    border-radius: 12px;
    gap: 1rem;
  }
`;

const TabButton = styled.button<{ $active: boolean }>`
  position: relative;
  padding: 0.5rem 2rem;
  font-size: 1.6rem;
  font-weight: 500;
  color: ${({ $active }) =>
    $active ? "var(--color-grey-900)" : "var(--color-grey-500)"};
  background: transparent;
  border: none;
  text-align: center;
  cursor: pointer;
  outline: none;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  white-space: nowrap;
  text-transform: capitalize;
  transition: all 0.3s ease-in-out;

  &:hover {
    color: var(--color-grey-900);
  }

  @media (min-width: ${breakpoints.md}) {
    padding: 0.5rem 1.5rem;
    font-size: 1.4rem;
    border-radius: 5px;
    background: ${({ $active }) =>
      $active ? "var(--color-grey-300)" : "transparent"};
  }
`;

interface TabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: string[];
}

export default function Tabs({ activeTab, setActiveTab, tabs }: TabsProps) {
  return (
    <TabsContainer>
      {tabs.map((tab) => (
        <TabButton
          key={tab}
          $active={activeTab === tab}
          onClick={() => setActiveTab(tab)}>
          {tab}
        </TabButton>
      ))}
    </TabsContainer>
  );
}
