import { WebSocketLink } from '@apollo/client/link/ws'
import { getMainDefinition } from '@apollo/client/utilities'
import { ApolloClient, InMemoryCache, HttpLink, split, NormalizedCacheObject, from } from '@apollo/client'
import { ErrorResponse, onError } from '@apollo/client/link/error'

const backendCoreURL = process.env.BACKEND_CORE_URL || 'https://tyrion.fit.vutbr.cz/riot/api'
const webSocketBackendCoreURL = (() => {
  const parsedBackendCoreURL = new URL(backendCoreURL)
  parsedBackendCoreURL.protocol = parsedBackendCoreURL.protocol.endsWith('s:') ? 'wss:' : 'ws:'
  return parsedBackendCoreURL.toString()
})()

let userRedirectedAlready: boolean = false

const client: ApolloClient<NormalizedCacheObject> = new ApolloClient({
  link: split(
    ({ query }) => {
      const definition = getMainDefinition(query)
      return definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
    },
    new WebSocketLink({ uri: webSocketBackendCoreURL }),
    from([
      onError(({ networkError }: ErrorResponse) => {
        if (networkError && 'statusCode' in networkError && (networkError as any).statusCode === 401 && !userRedirectedAlready) {
          userRedirectedAlready = true

          window.location.href = `/login?redirect=${encodeURIComponent(window.location.href)}`
        }
      }),
      new HttpLink({ uri: backendCoreURL, credentials: 'include' })
    ])
  ),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only'
    },
    query: {
      fetchPolicy: 'network-only'
    }
  }
})

export default client
