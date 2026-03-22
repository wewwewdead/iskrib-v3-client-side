import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './Context/Authcontext.jsx'
import { ThemeProvider } from './Context/ThemeContext.jsx'
import { ToastProvider } from './components/Toast/ToastContext.jsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Console greeting for curious developers
console.log(
  `%c
  ██╗███████╗██╗  ██╗██████╗ ██╗██████╗
  ██║██╔════╝██║ ██╔╝██╔══██╗██║██╔══██╗
  ██║███████╗█████╔╝ ██████╔╝██║██████╔╝
  ██║╚════██║██╔═██╗ ██╔══██╗██║██╔══██╗
  ██║███████║██║  ██╗██║  ██║██║██████╔╝
  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═════╝
`,
  'color: #d4a574; font-family: monospace; font-size: 12px;'
);
console.log(
  '%c Got cool ideas? %c Share them with me!\n' +
  '%c johnmathewloren27@gmail.com\n' +
  '%c Let\'s build it together.',
  'color: #fff; background: #d4a574; padding: 4px 8px; border-radius: 4px; font-size: 14px; font-weight: bold;',
  'color: #888; font-size: 13px;',
  'color: #d4a574; font-size: 14px; font-weight: bold; padding: 4px 0;',
  'color: #aaa; font-size: 12px; font-style: italic;'
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: 0,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
