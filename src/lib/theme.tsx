import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme'

type ThemeContextValue = {
  /** What the user has chosen — system means "follow OS" */
  preference: ThemePreference
  setPreference: (p: ThemePreference) => void
  /** Cycles system → light → dark → system */
  cycle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system'
  const v = window.localStorage.getItem(STORAGE_KEY)
  return v === 'light' || v === 'dark' ? v : 'system'
}

function applyToDocument(p: ThemePreference) {
  if (typeof document === 'undefined') return
  if (p === 'system') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', p)
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference)

  // Apply on mount + whenever preference changes
  useEffect(() => {
    applyToDocument(preference)
    if (preference === 'system') {
      window.localStorage.removeItem(STORAGE_KEY)
    } else {
      window.localStorage.setItem(STORAGE_KEY, preference)
    }
  }, [preference])

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p)
  }, [])

  const cycle = useCallback(() => {
    setPreferenceState((curr) =>
      curr === 'system' ? 'light' : curr === 'light' ? 'dark' : 'system',
    )
  }, [])

  return (
    <ThemeContext.Provider value={{ preference, setPreference, cycle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
