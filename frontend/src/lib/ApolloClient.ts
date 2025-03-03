import { ApolloClient, InMemoryCache } from '@apollo/client';

const client = new ApolloClient({
    uri: process.env.BACKEND_CORE_URL,
    cache: new InMemoryCache(),
});

export default client;