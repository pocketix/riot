import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import './index.scss'
import { ApolloClient, InMemoryCache, ApolloProvider, NormalizedCacheObject, split, HttpLink } from '@apollo/client'
import { getMainDefinition } from '@apollo/client/utilities'
import { WebSocketLink } from '@apollo/client/link/ws'
import { createTheme, Theme, ThemeProvider } from '@mui/material'
import NiceModal from '@ebay/nice-modal-react'

import Homepage from './pages/Homepage'
import FallbackPage from './pages/FallbackPage'
import SDTypesPageController from './pages/sd-types-page/SDTypesPageController'
import SDInstancesPageController from './pages/sd-instances-page/SDInstancesPageController'
import KPIDetailPageController from './pages/kpi-detail-page/KPIDetailPageController'
import KPIPageController from './pages/kpi-page/KPIPageController'
import CustomLinkButton from './page-independent-components/CustomLinkButton'
import { ApolloSandbox } from '@apollo/sandbox/react'
import ConfigurationPage from './pages/ConfigurationPage'
import SDInstanceGroupsPageController from './pages/sd-instance-groups-page/SDInstanceGroupsPageController'

const backendCoreURL: string = process.env.BACKEND_CORE_URL || 'http://localhost:9090'
const webSocketBackendCoreURL: string = (() => {
  const parsedBackendCoreURL = new URL(backendCoreURL)
  parsedBackendCoreURL.protocol = parsedBackendCoreURL.protocol.endsWith('s:') ? 'wss:' : 'ws:'
  return parsedBackendCoreURL.toString()
})()

console.info(`RIoT frontend is set to communicate with RIoT backend running at: ${backendCoreURL}, ${webSocketBackendCoreURL}`)

const apolloClient: ApolloClient<NormalizedCacheObject> = new ApolloClient({
  link: split(
    ({ query }) => {
      const definition = getMainDefinition(query)
      return definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
    },
    new WebSocketLink({ uri: webSocketBackendCoreURL }),
    new HttpLink({ uri: backendCoreURL })
  ),
  cache: new InMemoryCache(),
  defaultOptions: {
    // TODO: Currently bypassing the Apollo Client cache...
    watchQuery: {
      fetchPolicy: 'network-only'
    },
    query: {
      fetchPolicy: 'network-only'
    }
  }
})

const customTheme: Theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#000000',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#ffffff',
      contrastText: '#000000'
    },
    background: {
      default: '#ffffff',
      paper: '#f0f0f0'
    },
    text: {
      primary: '#000000',
      secondary: 'rgba(0, 0, 0, 0.7)',
      disabled: 'rgba(0, 0, 0, 0.38)'
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          color: '#000000',
          backgroundColor: '#e0e0e0',
          '&:hover': {
            backgroundColor: '#bdbdbd'
          },
          textTransform: 'none'
        }
      }
    }
  }
})

const sdInstanceGroups = 'sd-instance-groups'
const sdInstances = 'sd-instances'
const sdTypes = 'sd-types'
const kpiDefinitions = 'kpi-definitions'
const configuration = 'configuration'
const apolloSandbox = 'apollo-sandbox'

const ApplicationLayout: React.FC = () => {
  return (
    <div className="flex h-screen">
      <div className="flex flex-col gap-4 bg-gray-100 px-2.5 py-8">
        <CustomLinkButton route="/" text="Homepage" iconIdentifier="home" />
        <CustomLinkButton route={`/${sdInstanceGroups}`} text="SD instance groups" iconIdentifier="communities" />
        <CustomLinkButton route={`/${sdInstances}`} text="SD instances" iconIdentifier="lightbulb" />
        <CustomLinkButton route={`/${sdTypes}`} text="SD type definitions" iconIdentifier="home_iot_device" />
        <CustomLinkButton route={`/${kpiDefinitions}`} text="KPI definitions" iconIdentifier="rule" />
        <div className="mt-auto flex flex-col gap-4">
          <CustomLinkButton route={`/${apolloSandbox}`} text="Apollo Sandbox" iconIdentifier="labs" />
        </div>
      </div>
      <div className="max-h-screen flex-1 overflow-y-scroll p-2.5 align-middle">
        <Outlet />
      </div>
    </div>
  )
}

const Application: React.FC = () => {
  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider theme={customTheme}>
        <NiceModal.Provider>
          <>
            <Routes>
              <Route path="/" element={<ApplicationLayout />}>
                <Route index element={<Homepage />} />
                <Route path={sdInstanceGroups} element={<SDInstanceGroupsPageController />} />
                <Route path={sdInstances} element={<SDInstancesPageController />} />
                <Route path={sdTypes} element={<SDTypesPageController />} />
                <Route path={kpiDefinitions} element={<KPIPageController />} />
                <Route path={`${kpiDefinitions}/create`} element={<KPIDetailPageController />} />
                <Route path={`${kpiDefinitions}/:id/edit`} element={<KPIDetailPageController />} />
                <Route path={apolloSandbox} element={<ApolloSandbox initialEndpoint={backendCoreURL} allowDynamicStyles className="h-full w-full" />} />
                <Route path="*" element={<FallbackPage />} />
              </Route>
            </Routes>
          </>
        </NiceModal.Provider>
      </ThemeProvider>
    </ApolloProvider>
  )
}

ReactDOM.createRoot(document.getElementById('reactApplicationRoot')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Application />
    </BrowserRouter>
  </React.StrictMode>
)
