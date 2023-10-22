import * as React from "react"
import * as ReactDOM from "react-dom/client"
import {BrowserRouter} from "react-router-dom"
import ApplicationEntrypoint from "./ApplicationEntrypoint"
import "./index.css"

ReactDOM.createRoot(document.getElementById("reactApplicationRoot")!).render(
    <React.StrictMode>
        <BrowserRouter>
            <ApplicationEntrypoint/>
        </BrowserRouter>
    </React.StrictMode>
)
