import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './lib/theme'
import { AuthModalProvider } from './lib/authModal'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthModalProvider>
        <App />
      </AuthModalProvider>
    </ThemeProvider>
  </StrictMode>,
)
