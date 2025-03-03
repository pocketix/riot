import { BrowserRouter, Route, Routes } from "react-router-dom";
import GlobalStyles from "./styles/GlobalStyles";
import AppLayout from "./ui/AppLayout";
import Dashboard from "./pages/Dashboard";
import Devices from "./pages/Devices";
import Members from "./pages/Members";
import Automations from "./pages/Automations";
import Settings from "./pages/Settings";
import PageNotFound from "./pages/PageNotFound";
import { DarkModeProvider } from "./context/DarkModeContext";
import DeviceTypes from "./features/devices/DeviceTypes";

export default function App() {
  return (
    <>
      <DarkModeProvider>
        <GlobalStyles />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="devices" element={<Devices />} />
              <Route path="members" element={<Members />} />
              <Route path="automations" element={<Automations />} />
              <Route path="settings" element={<Settings />} />
              <Route path="settings/deviceTypes" element={<DeviceTypes />} />
            </Route>
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </BrowserRouter>
      </DarkModeProvider>
    </>
  );
}
