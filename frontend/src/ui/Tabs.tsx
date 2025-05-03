import { breakpoints } from '@/styles/Breakpoints'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'

const TabsContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  width: max-content;
  backdrop-filter: blur(12px);
  padding: 0.1rem;
  border: 1px solid var(--color-grey-300);
  transition: all 0.3s ease-in-out;
  border-radius: 12px;
  gap: 0.7rem;
  width: 100%;

  @media (min-width: ${breakpoints.sm}) {
    width: max-content;
  }
`

const TabButton = styled(NavLink)`
  position: relative;
  padding: 0.3rem 1rem;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--color-grey-500);
  background: transparent;
  border-radius: 10px;
  text-decoration: none;
  text-transform: capitalize;
  transition: all 0.3s ease-in-out;
  width: 100%;
  text-align: center;

  &.active {
    color: var(--color-grey-900);
    background: var(--color-grey-300);
  }

  @media (min-width: ${breakpoints.md}) {
    width: auto;
  }
`

interface TabsProps {
  tabs: { name: string; path: string }[]
}

export default function Tabs({ tabs }: TabsProps) {
  return (
    <TabsContainer>
      {tabs.map((tab) => (
        <TabButton key={tab.name} to={tab.path}>
          {tab.name}
        </TabButton>
      ))}
    </TabsContainer>
  )
}
