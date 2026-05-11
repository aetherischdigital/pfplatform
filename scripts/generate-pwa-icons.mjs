// Generate PWA + Apple touch raster icons from the brand SVG source.
//
// Run: node scripts/generate-pwa-icons.mjs
//
// Outputs (overwriting):
//   public/apple-touch-icon.png       — 180x180, iOS home screen
//   public/icon-192.png               — 192x192, Android PWA standard
//   public/icon-512.png               — 512x512, Android PWA / splash
//   public/icon-maskable-512.png      — 512x512, full-bleed, Android adaptive
//
// Edit BRAND_COLOR / MARK_COLOR / MARK_TEXT here to update the icon set.

import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const BRAND_COLOR = '#1E2A1D'
const MARK_COLOR = '#B89571'
const MARK_TEXT = 'PFP'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = resolve(__dirname, '..', 'public')

/**
 * Standard icon — rounded rect background, mark centered. Matches favicon.svg.
 */
function standardSvg(size) {
  const radius = Math.round(size * 0.19)
  const fontSize = Math.round(size * 0.41)
  const textY = Math.round(size * 0.69)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${BRAND_COLOR}"/>
  <text x="${size / 2}" y="${textY}"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
        font-size="${fontSize}"
        font-weight="800"
        text-anchor="middle"
        fill="${MARK_COLOR}"
        letter-spacing="-${Math.round(fontSize * 0.05)}">${MARK_TEXT}</text>
</svg>`
}

/**
 * Maskable icon — full-bleed (no rounded corners) so Android can mask freely.
 * Mark sized to fit within the 80% safe zone.
 */
function maskableSvg(size) {
  const fontSize = Math.round(size * 0.32)
  const textY = Math.round(size * 0.62)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BRAND_COLOR}"/>
  <text x="${size / 2}" y="${textY}"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
        font-size="${fontSize}"
        font-weight="800"
        text-anchor="middle"
        fill="${MARK_COLOR}"
        letter-spacing="-${Math.round(fontSize * 0.05)}">${MARK_TEXT}</text>
</svg>`
}

async function renderTo(svg, size, filename) {
  const out = resolve(PUBLIC_DIR, filename)
  await sharp(Buffer.from(svg), { density: 384 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(out)
  console.log(`✓ ${filename}  ${size}x${size}`)
}

await mkdir(PUBLIC_DIR, { recursive: true })
await renderTo(standardSvg(180), 180, 'apple-touch-icon.png')
await renderTo(standardSvg(192), 192, 'icon-192.png')
await renderTo(standardSvg(512), 512, 'icon-512.png')
await renderTo(maskableSvg(512), 512, 'icon-maskable-512.png')

console.log('Done.')
