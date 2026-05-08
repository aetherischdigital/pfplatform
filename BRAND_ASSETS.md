# Brand Asset Drop-Ins

Replace these files when client confirms branding. Paths are referenced from
`index.html` and the Vite SEO plugin — keeping the filenames the same means
no code changes needed.

## Files

| Path | Purpose | Spec |
|---|---|---|
| `favicon.svg` | Browser tab icon | Single SVG, scales for all sizes |
| `og-image.svg` | Social link previews (FB, Twitter, iMessage, Slack) | 1200x630. PNG also acceptable — if so, also update `og:image` path in `index.html` and `vite.config.ts` |
| `apple-touch-icon.png` *(not yet shipped)* | iOS home-screen icon | 180x180 PNG. Add to `public/` and reference from `index.html` |

## What text comes from where

The OG/social text content (`og:title`, `og:description`, etc.) is generated
from `src/config/brand.ts` at build time via the Vite plugin. Update the
brand config and the meta tags update automatically.

The OG **image** itself is a separate static asset — replace the SVG/PNG
above when the designed version arrives.
