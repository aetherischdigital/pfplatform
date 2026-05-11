import { createContext, useContext } from 'react'

export type AuthView = 'login' | 'signup'

export type AuthModalContextValue = {
  open: boolean
  view: AuthView
  openModal: (view?: AuthView) => void
  closeModal: () => void
}

export const AuthModalContext = createContext<AuthModalContextValue | null>(null)

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext)
  if (!ctx) throw new Error('useAuthModal must be used inside <AuthModalProvider>')
  return ctx
}
