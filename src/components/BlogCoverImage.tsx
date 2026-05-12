import { useState } from 'react'

type Props = {
  /**
   * Base path of the cover image (no extension). BlogCoverImage will build:
   *   - <source type="image/webp" srcset="{src}-800.webp 800w, {src}-1600.webp 1600w">
   *   - <img srcset="{src}-800.jpg 800w, {src}-1600.jpg 1600w">
   * If `sizes` isn't passed, defaults to a sensible responsive value.
   */
  src: string
  alt: string
  className?: string
  loading?: 'eager' | 'lazy'
  /** Optional sizes hint — defaults to a responsive value tuned to blog cards. */
  sizes?: string
}

/**
 * Cover image for blog cards + the post detail view. Self-hosted under
 * /public/img/blog/ with two widths × two formats (WebP + JPEG). If the
 * source 404s, we render a brand-tinted placeholder so the layout doesn't
 * collapse — every card stays the same shape whether the image loaded or
 * not.
 */
export default function BlogCoverImage({
  src,
  alt,
  className = '',
  loading = 'lazy',
  sizes = '(min-width: 1024px) 600px, (min-width: 640px) 50vw, 100vw',
}: Props) {
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
    <picture className={className}>
      <source
        type="image/webp"
        srcSet={`${src}-800.webp 800w, ${src}-1600.webp 1600w`}
        sizes={sizes}
      />
      <img
        src={`${src}-1600.jpg`}
        srcSet={`${src}-800.jpg 800w, ${src}-1600.jpg 1600w`}
        sizes={sizes}
        alt={alt}
        loading={loading}
        decoding="async"
        onError={() => setErrored(true)}
        className="h-full w-full object-cover"
      />
    </picture>
  )
}
