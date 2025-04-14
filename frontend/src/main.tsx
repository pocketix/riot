import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ApolloProvider } from '@apollo/client'
import { Toaster } from 'sonner'
import App from './App.tsx'
import './utils/i18next.ts'
import './index.css'
import client from './lib/ApolloClient.ts'
import { breakpoints } from './styles/Breakpoints.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApolloProvider client={client!}>
      <Toaster
        toastOptions={{
          style:
            window.innerWidth < Number(breakpoints.md.replace('px', ''))
              ? {
                  margin: '0 0 4rem 0'
                }
              : {}
        }}
      />
      <App />
    </ApolloProvider>
  </StrictMode>
)
