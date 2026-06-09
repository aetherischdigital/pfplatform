import type { ReactNode } from 'react'
import Container from '../ui/Container'
import Kicker from '../ui/Kicker'

/**
 * Shared header for secondary marketing pages. Replaces the per-page
 * `bg-gradient-to-b from-surface-50 to-white` centered hero with a flat,
 * left-aligned, hairline-ruled document header that ties back to the landing
 * page's editorial voice.
 */
type Props = {
  kicker: string
  title: ReactNode
  intro?: ReactNode
  /** Container width — 'md' for prose/legal pages, 'lg' for everything else. */
  size?: 'md' | 'lg'
  children?: ReactNode
}

export default function PageHeader({ kicker, title, intro, size = 'lg', children }: Props) {
  return (
    <section className="border-b border-surface-200 bg-surface-50">
      <Container size={size} className="py-16 lg:py-20">
        <Kicker>{kicker}</Kicker>
        <h1 className="mt-5 max-w-3xl font-display text-5xl font-semibold tracking-tight text-surface-900 sm:text-6xl">
          {title}
        </h1>
        {intro && <div className="mt-5 max-w-2xl text-lg leading-relaxed text-surface-500">{intro}</div>}
        {children}
      </Container>
    </section>
  )
}
