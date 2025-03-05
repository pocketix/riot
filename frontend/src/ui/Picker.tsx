import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { FaChevronDown } from "react-icons/fa";

const PickerContainer = styled.div`
  position: relative;
  width: 100%;
`;

const PickerButton = styled.button`
  width: 100%;
  padding: 0.6rem; /* Reduced padding */
  font-size: 1.2rem; /* Smaller font size */
  border: 1px solid hsl(var(--color-grey-300));
  border-radius: 6px; /* Slightly smaller border-radius */
  background: hsl(var(--color-grey-100));
  color: hsl(var(--color-grey-900));
  cursor: pointer;
  text-transform: capitalize;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:focus {
    outline: none;
    border-color: hsl(var(--color-grey-500));
  }
`;

const Dropdown = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: hsl(var(--color-grey-200));
  border-radius: 6px; /* Adjusted */
  box-shadow: 0px 3px 8px rgba(0, 0, 0, 0.1); /* Slightly softer shadow */
  z-index: 10;
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 160px; /* Reduced height */
  overflow-y: auto;
`;

const DropdownItem = styled.li<{ $active: boolean }>`
  padding: 0.8rem; /* Reduced padding */
  font-size: 1.1rem; /* Adjusted font size */
  cursor: pointer;
  text-transform: capitalize;
  background: ${({ $active }) =>
    $active ? "hsl(var(--color-grey-300))" : "hsl(var(--color-grey-200))"};
  color: hsl(var(--color-grey-900));
  transition: background 0.2s ease-in-out;

  &:hover {
    background: hsl(var(--color-grey-400));
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
