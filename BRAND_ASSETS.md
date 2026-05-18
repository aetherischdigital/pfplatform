# Brand Asset Drop-Ins

Replace these files when client confirms branding. Paths are referenced from
`index.html`, `public/manifest.webmanifest`, and the Vite SEO plugin —
keeping the filenames the same means no code changes needed.

## Files

| Path | Purpose | Spec |
|---|---|---|
| `public/favicon.svg` | Browser tab icon | Single SVG, scales for all sizes |
| `public/og-image.svg` | Social link previews (FB, Twitter, iMessage, Slack) | 1200x630. PNG also acceptable — if so, also update `og:image` path in `index.html` and `vite.config.ts` |
| `public/apple-touch-icon.png` | iOS home-screen icon | 180x180 PNG |
| `public/icon-192.png` | Android PWA (standard) | 192x192 PNG |
| `public/icon-512.png` | Android PWA / splash (standard) | 512x512 PNG |
| `public/icon-maskable-512.png` | Android adaptive icon | 512x512 PNG, full-bleed; content sized to inner 80% safe zone |
| `public/manifest.webmanifest` | PWA manifest | Edit name/colors when brand changes |

## Regenerating the raster icons

The four PNG icons above are generated from the brand mark + color constants
in `scripts/generate-pwa-icons.mjs`. To regenerate after a brand update:

```
node scripts/generate-pwa-icons.mjs
```

Edit the `BRAND_COLOR`, `MARK_COLOR`, and `MARK_TEXT` constants at the top
of the script to match the new identity, then rerun.

## What text comes from where

The OG/social text content (`og:title`, `og:description`, etc.) is generated
from `src/config/brand.ts` at build time via the Vite plugin. Update the
brand config and the meta tags update automatically.

The OG **image** itself is a separate static asset — replace the SVG/PNG
above when the designed version arrives.
