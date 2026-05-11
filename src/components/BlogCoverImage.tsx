import { useState } from 'react'

type Props = {
  src: string
  alt: string
  className?: string
  loading?: 'eager' | 'lazy'
}

/**
 * Cover image for blog cards + the post detail view. Hot-linked from a
 * royalty-free CDN (currently Unsplash). If the source 404s, we silently
 * render a brand-tinted placeholder so the layout doesn't collapse — every
 * card stays the same shape whether the image loaded or not.
 */
export default function BlogCoverImage({ src, alt, className = '', loading = 'lazy' }: Props) {
  const [errored, setErrored] = useState(false)

  if (errored) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-surface-100 to-surface-200 ${className}`}
        aria-hidden="true"
      >
        <div className="font-display text-2xl font-semibold text-surface-400/60 select-none">
          PFP
        </div>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => setErrored(true)}
      className={`object-cover ${className}`}
    />
  )
}
