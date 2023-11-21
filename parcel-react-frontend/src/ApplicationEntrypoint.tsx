import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { ApolloClient, InMemoryCache, ApolloProvider, NormalizedCacheObject } from '@apollo/client'
import { createTheme, Theme, ThemeProvider } from '@mui/material'

import PrimaryLayout from './page-independent-components/primary-layout/PrimaryLayout'
import Homepage from './pages/homepage/Homepage'
import ApolloSandboxPage from './pages/apollo-sandbox-page/ApolloSandboxPage'
import FallbackPage from './pages/fallback-page/FallbackPage'
import DeviceTypesPageController from './pages/device-types-page/DeviceTypesPageController'
import DevicesPageController from './pages/devices-page/DevicesPageController'

const apolloClient: ApolloClient<NormalizedCacheObject> = new ApolloClient({
  uri: 'http://localhost:9090',
  cache: new InMemoryCache()
})

const customMuiTheme: Theme = createTheme({
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

const ApplicationEntrypoint: React.FC = () => {
  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider theme={customMuiTheme}>
        <>
          <Routes>
            <Route path="/" element={<PrimaryLayout />}>
              <Route index element={<Homepage />} />
              <Route path="devices" element={<DevicesPageController />} />
              <Route path="device-types" element={<DeviceTypesPageController />} />
              <Route path="apollo-sandbox" element={<ApolloSandboxPage />} />
              <Route path="*" element={<FallbackPage />} />
            </Route>
          </Routes>
        </>
      </ThemeProvider>
    </ApolloProvider>
  )
}

export default ApplicationEntrypoint
