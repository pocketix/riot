import React from "react"
import {Routes, Route} from "react-router-dom"
import {ApolloClient, InMemoryCache, ApolloProvider, NormalizedCacheObject} from '@apollo/client'

import MainLayout from "./components/main-layout/MainLayout"
import Homepage from "./pages/homepage/Homepage"
import ApolloSandboxPage from "./pages/apollo-sandbox-page/ApolloSandboxPage"
import FallbackPage from "./pages/fallback-page/FallbackPage"
import DTDPage from "./pages/dtd-page/DTDPage"

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
                    <Route path="dtd" element={<DTDPage/>}/>
                    <Route path="apollo-sandbox" element={<ApolloSandboxPage/>}/>
                    <Route path="*" element={<FallbackPage/>}/>
                </Route>
            </Routes>
        </>
    </ApolloProvider>
}

export default ApplicationEntrypoint
