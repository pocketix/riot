import React from "react"
import {Routes, Route} from "react-router-dom"
import {ApolloClient, InMemoryCache, ApolloProvider, NormalizedCacheObject} from '@apollo/client'
import {createTheme, Theme, ThemeProvider} from "@mui/material"

import MainLayout from "./components/main-layout/MainLayout"
import Homepage from "./pages/homepage/Homepage"
import ApolloSandboxPage from "./pages/apollo-sandbox-page/ApolloSandboxPage"
import FallbackPage from "./pages/fallback-page/FallbackPage"
import DeviceTypesPage from "./pages/device-types-page/DeviceTypesPage"

const apolloClient: ApolloClient<NormalizedCacheObject> = new ApolloClient({
    uri: 'http://localhost:9090',
    cache: new InMemoryCache()
})

const ApplicationEntrypoint: React.FC = () => {

    const customMuiTheme: Theme = createTheme({
        palette: {
            mode: 'light',  // Use 'dark' for dark mode if needed
            primary: {
                main: '#000000',  // Black color
                contrastText: '#ffffff',  // White text on primary color
            },
            secondary: {
                main: '#ffffff',  // White color
                contrastText: '#000000',  // Black text on secondary color
            },
            background: {
                default: '#ffffff',  // White background
                paper: '#f0f0f0',    // Slightly off-white for surfaces like cards
            },
            text: {
                primary: '#000000',  // Primary text color (black)
                secondary: 'rgba(0, 0, 0, 0.7)',  // Slightly lighter for secondary text
                disabled: 'rgba(0, 0, 0, 0.38)'  // Disabled text color
            },
        },
    })

    return <ApolloProvider client={apolloClient}>
        <ThemeProvider theme={customMuiTheme}>
            <>
                <Routes>
                    <Route path="/" element={<MainLayout/>}>
                        <Route index element={<Homepage/>}/>
                        <Route path="device-types" element={<DeviceTypesPage/>}/>
                        <Route path="apollo-sandbox" element={<ApolloSandboxPage/>}/>
                        <Route path="*" element={<FallbackPage/>}/>
                    </Route>
                </Routes>
            </>
        </ThemeProvider>
    </ApolloProvider>
}

export default ApplicationEntrypoint
