import type { ReactNode } from 'react'
import Tooltip from './Tooltip'
import { GLOSSARY, type GlossaryKey } from '../../lib/glossary'

type Props = {
  /** Glossary key — drives the definition shown in the tooltip. */
  term: GlossaryKey
  /** The inline term as it appears in the surrounding prose. */
  children: ReactNode
  placement?: 'top' | 'bottom'
}

/**
 * Inline term with a plain-English definition on hover/tap/focus. Wrapper
 * around <Tooltip> + the central GLOSSARY map so copy stays terse and the
 * definitions live in one place.
 */
export default function Term({ term, children, placement }: Props) {
  return (
    <Tooltip content={GLOSSARY[term]} placement={placement}>
      {children}
    </Tooltip>
  )
}
