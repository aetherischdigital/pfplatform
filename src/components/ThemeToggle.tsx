import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme, type ThemePreference } from '../lib/useTheme'

const icons: Record<ThemePreference, typeof Sun> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
}

const labels: Record<ThemePreference, string> = {
  system: 'System theme — click for light',
  light: 'Light theme — click for dark',
  dark: 'Dark theme — click for system',
}

type Props = {
  className?: string
}

export default function ThemeToggle({ className = '' }: Props) {
  const { preference, cycle } = useTheme()
  const Icon = icons[preference]
  return (
    <button
      type="button"
      onClick={cycle}
      title={labels[preference]}
      aria-label={labels[preference]}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border border-surface-300 text-surface-500 transition-colors hover:border-accent-400 hover:text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 ${className}`}
    >
      <Icon size={16} />
    </button>
  )
}
