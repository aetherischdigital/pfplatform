import { Eye, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { homePathFor } from '../lib/profile'

const ROLE_LABEL: Record<'homeowner' | 'advisor' | 'admin', string> = {
  homeowner: 'homeowner',
  advisor: 'advisor',
  admin: 'admin',
}

export default function ViewAsBanner() {
  const { profile, viewAsRole, setViewAs } = useAuth()
  const navigate = useNavigate()

  if (profile?.role !== 'admin' || !viewAsRole) return null

  const exit = () => {
    setViewAs(null)
    navigate(homePathFor('admin'))
  }

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-warning-200 bg-warning-50 px-4 py-2 text-sm text-warning-700">
      <div className="flex items-center gap-2">
        <Eye size={14} className="flex-shrink-0" />
        <span>
          Viewing as <strong className="font-semibold">{ROLE_LABEL[viewAsRole]}</strong> — your
          session is still <strong className="font-semibold">admin</strong>.
        </span>
      </div>
      <button
        type="button"
        onClick={exit}
        className="inline-flex items-center gap-1.5 rounded-md border border-warning-200 bg-surface-50 px-2.5 py-1 text-xs font-medium text-warning-700 hover:bg-warning-50"
      >
        <X size={12} /> Exit view-as
      </button>
    </div>
  )
}
