import { WebSocketLink } from "@apollo/client/link/ws";
import { getMainDefinition } from "@apollo/client/utilities";
import { ApolloClient, InMemoryCache, HttpLink, split } from "@apollo/client";

const backendCoreURL =
  process.env.BACKEND_CORE_URL || "https://tyrion.fit.vutbr.cz/riot/api";
const webSocketBackendCoreURL = (() => {
  const parsedBackendCoreURL = new URL(backendCoreURL);
  parsedBackendCoreURL.protocol = parsedBackendCoreURL.protocol.endsWith("s:")
    ? "wss:"
    : "ws:";
  return parsedBackendCoreURL.toString();
})();

const client = new ApolloClient({
  uri: process.env.BACKEND_CORE_URL,
  cache: new InMemoryCache(),
  link: split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === "OperationDefinition" &&
        definition.operation === "subscription"
      );
    },
    new WebSocketLink({
      uri: webSocketBackendCoreURL,
      options: { reconnect: true },
    }),
    new HttpLink({ uri: backendCoreURL })
  ),
  defaultOptions: {
    watchQuery: { fetchPolicy: "network-only" },
    query: { fetchPolicy: "network-only" },
  },
});

export default client;
