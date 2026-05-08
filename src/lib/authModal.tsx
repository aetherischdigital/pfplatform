import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'

export type AuthView = 'login' | 'signup'

type AuthModalContextValue = {
  open: boolean
  view: AuthView
  openModal: (view?: AuthView) => void
  closeModal: () => void
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null)

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<AuthView>('login')

  const openModal = useCallback((v: AuthView = 'login') => {
    setView(v)
    setOpen(true)
  }, [])

  const closeModal = useCallback(() => setOpen(false), [])

  return (
    <AuthModalContext.Provider value={{ open, view, openModal, closeModal }}>
      {children}
    </AuthModalContext.Provider>
  )
}

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext)
  if (!ctx) throw new Error('useAuthModal must be used inside <AuthModalProvider>')
  return ctx
}
