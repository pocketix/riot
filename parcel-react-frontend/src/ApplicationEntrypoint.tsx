import React from "react"
import {Routes, Route} from "react-router-dom"
import MainLayout from "./components/main-layout/MainLayout"
import Homepage from "./pages/homepage/Homepage"
import ApolloSandboxPage from "./pages/apollo-sandbox-page/ApolloSandboxPage"
import FallbackPage from "./pages/fallback-page/FallbackPage"
import DTDPage from "./pages/dtd-page/DTDPage"

const ApplicationEntrypoint: React.FC = () => {

    return <div>
        <Routes>
            <Route path="/" element={<MainLayout/>}>
                <Route index element={<Homepage/>}/>
                <Route path="dtd" element={<DTDPage/>}/>
                <Route path="apollo-sandbox" element={<ApolloSandboxPage/>}/>
                <Route path="*" element={<FallbackPage/>}/>
            </Route>
        </Routes>
    </div>
}

export default ApplicationEntrypoint
