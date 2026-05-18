import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './lib/theme'
import { AuthProvider } from './lib/auth'
import { AuthModalProvider } from './lib/authModal'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <AuthModalProvider>
          <App />
        </AuthModalProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)

// Register the service worker only on production builds. Dev keeps SW off
// so HMR/cache busting works normally.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Swallow — SW registration is best-effort and never blocks the app.
    })
  })
}
