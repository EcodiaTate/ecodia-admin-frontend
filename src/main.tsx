import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            borderBottomColor: 'rgba(0, 0, 0, 0.04)',
            borderRightColor: 'rgba(0, 0, 0, 0.04)',
            boxShadow: '0 20px 50px -12px rgba(0, 104, 122, 0.06)',
            borderRadius: '1rem',
            color: '#1A1C1C',
            fontSize: '0.875rem',
            fontFamily: 'Inter, system-ui, sans-serif',
          },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>,
)
