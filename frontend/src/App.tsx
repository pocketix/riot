import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppLayout from './ui/AppLayout'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import Automations from './pages/Automations'
import Settings from './pages/Settings'
import PageNotFound from './pages/PageNotFound'
import { DarkModeProvider } from './context/DarkModeContext'
import ApolloSandboxPage from './pages/ApolloSandboxPage'
import GeneralSettings from './features/settings/GeneralSettings'
import PersonalInfoSettings from './features/settings/PersonalInfoSettings'
import DeviceTypesSettings from './features/settings/DeviceTypes/DeviceTypesSettings'
import DeviceTypeDetail from './features/settings/DeviceTypes/DeviceTypeDetail'
import Login from './pages/Login'
import Devices from './features/devices/Devices'
import DeviceGroups from './features/devices/DeviceGroups'
import KPIDefinitions from './features/settings/KPIDefinitions/KPIDefinitions'
import KPIEditor from './features/settings/KPIDefinitions/KPIEditor'
import NiceModal from '@ebay/nice-modal-react'
import ProtectedRoute from './utils/ProtectedRoute'
import MembersDetail from './features/members/MembersDetail'

export default function App() {
  return (
    <>
      <DarkModeProvider>
        <NiceModal.Provider>
          <BrowserRouter>
            <Routes>
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="/devices" element={<Devices />} />
                  <Route path="/groups" element={<DeviceGroups />} />
                  <Route path="members" element={<Members />} />
                  <Route path="members/:id" element={<MembersDetail />} />
                  <Route path="automations" element={<Automations />} />
                  <Route path="/settings" element={<Settings />}>
                    <Route path="general" element={<GeneralSettings />} />
                    <Route path="personal-info" element={<PersonalInfoSettings />} />
                    <Route path="device-types" element={<DeviceTypesSettings />} />
                    <Route path="/settings/kpi-definitions" element={<KPIDefinitions />} />
                    <Route path="/settings/device-types/:id" element={<DeviceTypeDetail />} />
                    <Route path="/settings/deivce-types/addNewType" element={<DeviceTypeDetail />} />
                    <Route index element={<GeneralSettings />} />
                  </Route>
                  <Route path="/settings/kpi-definitions/create" element={<KPIEditor />} />
                  <Route path="/settings/kpi-definitions/:id/edit" element={<KPIEditor />} />
                  <Route path="settings/apollo-sandbox" element={<ApolloSandboxPage />} />
                </Route>
              </Route>
              <Route path="*" element={<PageNotFound />} />
              <Route path="login" element={<Login />} />
            </Routes>
          </BrowserRouter>
        </NiceModal.Provider>
      </DarkModeProvider>
    </>
  )
}
