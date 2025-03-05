import styled from "styled-components";

const TabsContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  width: 100%;
  backdrop-filter: blur(12px);
  margin-bottom: 1rem;

  @media (min-width: 768px) {
    width: max-content;
    align-self: flex-start;
    border-radius: 12px;
    gap: 0.7rem;
  }
`;

const TabButton = styled.button<{ $active: boolean }>`
  position: relative;
  padding: 0.3rem 1rem;
  font-size: 1.1rem;
  font-weight: 500;

  color: ${({ $active }) =>
    $active ? "var(--color-grey-900)" : "var(--color-grey-500)"};
  background: ${({ $active }) =>
    $active ? "var(--color-grey-300)" : "transparent"};

  border-radius: 5px;
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
    color: hsl(var(--color-grey-900));
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
