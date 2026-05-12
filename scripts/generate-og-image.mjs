// Render the OG preview PNG from the SVG source. SVG -> 1200x630 PNG at
// 192 dpi so the rasterized text stays crisp on Slack/iMessage/Twitter.
//
// Run: node scripts/generate-og-image.mjs
//
// Source:  public/og-image.svg
// Output:  public/og-image.png  (referenced from index.html + usePageMeta)

import sharp from 'sharp'
import { statSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = resolve(__dirname, '..', 'public', 'og-image.svg')
const DST = resolve(__dirname, '..', 'public', 'og-image.png')

await sharp(SRC, { density: 192 })
  .resize(1200, 630)
  .png({ compressionLevel: 9 })
  .toFile(DST)

const size = statSync(DST).size
console.log(`✓ og-image.png  ${(size / 1024).toFixed(1)} KB`)
