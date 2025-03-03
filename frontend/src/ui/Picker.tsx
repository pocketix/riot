import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { FaChevronDown } from "react-icons/fa";

const PickerContainer = styled.div`
  position: relative;
  width: 100%;
`;

const PickerButton = styled.button`
  width: 100%;
  padding: 0.8rem;
  font-size: 1.6rem;
  border: 1px solid var(--color-grey-300);
  border-radius: 8px;
  background: var(--color-grey-100);
  color: var(--color-grey-900);
  cursor: pointer;
  text-transform: capitalize;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:focus {
    outline: none;
    border-color: var(--color-grey-500);
  }
`;

const Dropdown = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: var(--color-grey-200);
  border-radius: 8px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  z-index: 10;
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
`;

const DropdownItem = styled.li<{ $active: boolean }>`
  padding: 1rem;
  font-size: 1.4rem;
  cursor: pointer;
  text-transform: capitalize;
  background: ${({ $active }) =>
    $active ? "var(--color-grey-300)" : "var(--color-grey-200)"};
  color: var(--color-grey-900);
  transition: background 0.2s ease-in-out;

  &:hover {
    background: var(--color-grey-400);
  }
`;

interface PickerProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: string[];
}

export default function Picker({ activeTab, setActiveTab, tabs }: PickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <PickerContainer ref={dropdownRef}>
      <PickerButton onClick={() => setIsOpen((prev) => !prev)}>
        {activeTab}
        <FaChevronDown />
      </PickerButton>
      {isOpen && (
        <Dropdown>
          {tabs.map((tab) => (
            <DropdownItem
              key={tab}
              $active={activeTab === tab}
              onClick={() => {
                setActiveTab(tab);
                setIsOpen(false);
              }}>
              {tab}
            </DropdownItem>
          ))}
        </Dropdown>
      )}
    </PickerContainer>
  );
}
