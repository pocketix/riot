import { ApolloSandbox } from '@apollo/sandbox/react'
import {BACKEND_CORE_URL} from "@/utils/backendCoreUrl.ts";

export default function ApolloSandboxPage() {
  return (
    <div className="h-screen w-full">
      <ApolloSandbox initialEndpoint={BACKEND_CORE_URL} allowDynamicStyles className="h-full w-full" />
    </div>
  )
}
