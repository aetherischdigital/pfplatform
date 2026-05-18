import { createContext, useContext } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'

export type ThemeContextValue = {
  /** What the user has chosen — system means "follow OS" */
  preference: ThemePreference
  setPreference: (p: ThemePreference) => void
  /** Cycles system → light → dark → system */
  cycle: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
