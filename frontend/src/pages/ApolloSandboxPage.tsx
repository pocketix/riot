import { ApolloSandbox } from '@apollo/sandbox/react'

const backendCoreURL = process.env.BACKEND_CORE_URL || 'https://tyrion.fit.vutbr.cz/riot/api'

export default function ApolloSandboxPage() {
  return (
    <div className="h-screen w-full">
      <ApolloSandbox initialEndpoint={backendCoreURL} allowDynamicStyles className="h-full w-full" />
    </div>
  )
}
