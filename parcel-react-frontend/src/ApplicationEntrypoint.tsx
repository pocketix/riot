import React from "react"
import {Routes, Route} from "react-router-dom"
import {ApolloClient, InMemoryCache, ApolloProvider, NormalizedCacheObject} from '@apollo/client'

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

    return <ApolloProvider client={apolloClient}>
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
    </ApolloProvider>
}

export default ApplicationEntrypoint
