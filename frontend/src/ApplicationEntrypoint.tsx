import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { ApolloClient, InMemoryCache, ApolloProvider, NormalizedCacheObject } from '@apollo/client'
import { createTheme, Theme, ThemeProvider } from '@mui/material'

import PrimaryLayout from './page-independent-components/primary-layout/PrimaryLayout'
import Homepage from './pages/homepage/Homepage'
import ApolloSandboxPage from './pages/apollo-sandbox-page/ApolloSandboxPage'
import FallbackPage from './pages/fallback-page/FallbackPage'
import SDTypesPageController from './pages/sd-types-page/SDTypesPageController'
import SDInstancesPageController from './pages/sd-instances-page/SDInstancesPageController'

const apolloClient: ApolloClient<NormalizedCacheObject> = new ApolloClient({
  uri: 'http://localhost:9090',
  cache: new InMemoryCache(),
  defaultOptions: { // TODO: Currently bypassing the Apollo Client cache...
    watchQuery: {
      fetchPolicy: 'network-only',
    },
    query: {
      fetchPolicy: 'network-only',
    }
  },
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
              <Route path="sd-instances" element={<SDInstancesPageController />} />
              <Route path="sd-types" element={<SDTypesPageController />} />
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
