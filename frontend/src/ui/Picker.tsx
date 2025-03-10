import { useState, useRef, useEffect, act } from 'react'
import styled from 'styled-components'
import { FaChevronDown } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'

const PickerContainer = styled.div`
  position: relative;
  width: 100%;
  z-index: 10;
`

const PickerButton = styled.button`
  width: 100%;
  padding: 0.4rem;
  font-size: 1.2rem;
  border: 1px solid var(--color-grey-300);
  border-radius: 6px;
  background: var(--color-grey-300);
  color: var(--color-grey-900);
  cursor: pointer;
  text-transform: capitalize;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const Dropdown = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: var(--color-grey-200);
  border-radius: 6px;
  box-shadow: 0px 3px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 160px;
  overflow-y: auto;
`

const DropdownItem = styled.li`
  padding: 0.8rem;
  font-size: 1.1rem;
  cursor: pointer;
  text-transform: capitalize;
  color: var(--color-grey-900);
  transition: background 0.2s ease-in-out;

  &:hover {
    background: var(--color-grey-400);
  }
`

interface PickerProps {
  activeTab: string
  tabs: { name: string; path: string }[]
}

export default function Picker({ activeTab, tabs }: PickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <PickerContainer ref={dropdownRef}>
      <PickerButton onClick={() => setIsOpen((prev) => !prev)}>
        {tabs.filter((tab) => tab.path.startsWith(`/settings/${activeTab}`))[0]?.name}
        <FaChevronDown />
      </PickerButton>
      {isOpen && (
        <Dropdown>
          {tabs.map((tab) => (
            <DropdownItem
              key={tab.name}
              onClick={() => {
                navigate(tab.path)
                setIsOpen(false)
              }}
            >
              {tab.name}
            </DropdownItem>
          ))}
        </Dropdown>
      )}
    </PickerContainer>
  )
}
