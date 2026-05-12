import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { BRAND } from '../config/brand'

type Props = { children: ReactNode }
type State = { error: Error | null }

/**
 * Top-level error boundary. Catches anything that throws during render in a
 * descendant route, swaps in a branded fallback with a reload button, and
 * reports the error to GA (event "react_error") so we see a count without
 * needing a separate error-tracking SDK.
 *
 * Routes are still code-split — this boundary lives outside the Suspense
 * fallback, so a chunk-load failure surfaces here with the user-visible
 * fallback rather than a blank screen.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (typeof window === 'undefined') return
    // Best-effort console log — keeps the stack trace in the browser console
    // for the user (or us) to inspect.
    console.error('App crashed:', error, info)
    // Fire-and-forget GA event when gtag is present (no-op on localhost).
    const w = window as unknown as {
      gtag?: (...args: unknown[]) => void
    }
    if (typeof w.gtag === 'function') {
      w.gtag('event', 'react_error', {
        description: error.message?.slice(0, 200) ?? 'unknown',
        fatal: true,
      })
    }
  }

  reload = (): void => {
    window.location.reload()
  }

  goHome = (): void => {
    window.location.assign('/')
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children

    return (
      <div className="grid min-h-screen place-items-center bg-surface-50 px-6 py-16 text-center">
        <div className="max-w-md">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-danger-50 text-danger-600">
            <AlertTriangle size={20} />
          </div>
          <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight text-surface-900">
            Something went wrong.
          </h1>
          <p className="mt-3 text-sm text-surface-600">
            {BRAND.name} hit an unexpected error. Reloading the page usually fixes it. If it
            keeps happening, drop us a line at{' '}
            <a
              href="mailto:hello@pfplatform.app"
              className="text-accent-600 underline underline-offset-2 hover:text-accent-500"
            >
              hello@pfplatform.app
            </a>
            .
          </p>
          <div className="mt-7 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={this.reload}
              className="inline-flex h-10 items-center justify-center rounded-md bg-surface-900 px-4 text-sm font-medium text-white transition-colors hover:bg-surface-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
            >
              Reload the page
            </button>
            <button
              type="button"
              onClick={this.goHome}
              className="inline-flex h-10 items-center justify-center rounded-md border border-surface-300 bg-white px-4 text-sm font-medium text-surface-900 transition-colors hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
            >
              Back to home
            </button>
          </div>
        </div>
      </div>
    )
  }
}
