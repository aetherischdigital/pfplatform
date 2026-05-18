import { useCallback, useState, type ReactNode } from 'react'
import { AuthModalContext, type AuthView } from './useAuthModal'

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
