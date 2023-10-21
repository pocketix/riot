import React from "react"
import {createRoot, Root} from "react-dom/client"
import ApplicationEntrypoint from "./ApplicationEntrypoint"

const reactApplicationRootElement: HTMLElement = document.getElementById("reactApplicationRoot")
if (!reactApplicationRootElement) {
    throw new Error("Failed to find the root element")
}

const root: Root = createRoot(reactApplicationRootElement)
root.render(<ApplicationEntrypoint />)
