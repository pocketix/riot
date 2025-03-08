import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "./ui/AppLayout";
import Dashboard from "./pages/Dashboard";
import Devices from "./pages/Devices";
import Members from "./pages/Members";
import Automations from "./pages/Automations";
import Settings from "./pages/Settings";
import PageNotFound from "./pages/PageNotFound";
import { DarkModeProvider } from "./context/DarkModeContext";
import ApolloSandboxPage from "./pages/ApolloSandboxPage";
import GeneralSettings from "./features/settings/GeneralSettings";
import PersonalInfoSettings from "./features/settings/PersonalInfoSettings";
import DeviceTypesSettings from "./features/settings/DeviceTypes/DeviceTypesSettings";
import DeviceTypeDetail from "./features/settings/DeviceTypes/DeviceTypeDetail";

export default function App() {
  return (
    <>
      <DarkModeProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="devices" element={<Devices />} />
              <Route path="members" element={<Members />} />
              <Route path="automations" element={<Automations />} />
              <Route path="/settings" element={<Settings />}>
                <Route path="general" element={<GeneralSettings />} />
                <Route
                  path="personal-info"
                  element={<PersonalInfoSettings />}
                />
                <Route path="device-types" element={<DeviceTypesSettings />} />
                <Route
                  path="/settings/device-types/:id"
                  element={<DeviceTypeDetail />}
                />
                <Route index element={<GeneralSettings />} />
              </Route>
              <Route
                path="settings/apollo-sandbox"
                element={<ApolloSandboxPage />}
              />
            </Route>
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </BrowserRouter>
      </DarkModeProvider>
    </>
  );
}
