import { useMediaQuery } from "react-responsive";
import Tabs from "./Tabs";
import Picker from "./Picker";
import { breakpoints } from "@/styles/Breakpoints";

interface TabSwitcherProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: string[];
}

export default function TabSwitcher({
  activeTab,
  setActiveTab,
  tabs,
}: TabSwitcherProps) {
  const isMobile = useMediaQuery({ maxWidth: parseInt(breakpoints.md) - 1 });

  return isMobile ? (
    <Picker activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />
  ) : (
    <Tabs activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />
  );
}
