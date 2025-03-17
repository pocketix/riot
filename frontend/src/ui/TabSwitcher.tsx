import { useMediaQuery } from 'react-responsive'
import Tabs from './Tabs'
import Picker from './Picker'
import { breakpoints } from '@/styles/Breakpoints'

interface TabSwitcherProps {
  activeTab: string
  tabs: { name: string; path: string }[]
}

export default function TabSwitcher({ activeTab, tabs }: TabSwitcherProps) {
  const isMobile = useMediaQuery({ maxWidth: parseInt(breakpoints.sm) - 1 })

  return isMobile ? <Picker activeTab={activeTab} tabs={tabs} /> : <Tabs tabs={tabs} />
}
