// Mobile-viewport screenshot harness for QA passes. NOT committed-quality —
// keep here as a small dev tool. Drives puppeteer-core against the existing
// Edge install so no Chromium download is needed.
//
// Usage: node scripts/mobile-shoot.mjs <baseUrl> <outDir>

import puppeteer from 'puppeteer-core'
import { mkdir } from 'node:fs/promises'

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const [baseUrl, outDir] = process.argv.slice(2)
if (!baseUrl || !outDir) {
  console.error('Usage: node scripts/mobile-shoot.mjs <baseUrl> <outDir>')
  process.exit(1)
}
await mkdir(outDir, { recursive: true })

const routes = [
  ['/', 'home'],
  ['/how-it-works', 'how-it-works'],
  ['/calculator', 'calculator'],
  ['/pricing', 'pricing'],
  ['/blog', 'blog'],
  ['/about', 'about'],
  ['/privacy', 'privacy'],
]

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--no-sandbox'],
})

try {
  for (const [route, name] of routes) {
    const page = await browser.newPage()
    await page.emulate({
      viewport: {
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    })
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle0', timeout: 30_000 })
    await new Promise((r) => setTimeout(r, 500))

    const overflow = await page.evaluate(() => {
      const docW = document.documentElement.scrollWidth
      const viewW = window.innerWidth
      if (docW <= viewW + 1) return null
      let widest = null
      let maxRight = 0
      for (const el of document.body.querySelectorAll('*')) {
        const r = el.getBoundingClientRect()
        if (r.right > maxRight && r.width > 0) {
          maxRight = r.right
          widest = el
        }
      }
      const describe = (el) => {
        const id = el.id ? `#${el.id}` : ''
        const cls = (el.className?.toString?.() ?? '').trim().split(/\s+/).slice(0, 3).join('.')
        return `${el.tagName.toLowerCase()}${id}${cls ? '.' + cls : ''}`
      }
      const path = []
      let cur = widest
      while (cur && cur !== document.body) {
        path.unshift(describe(cur))
        cur = cur.parentElement
      }
      return {
        docW,
        viewW,
        widestRight: Math.round(maxRight),
        path: path.join(' > '),
      }
    })

    await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true })
    console.log(
      `${route.padEnd(18)} ${
        overflow
          ? `OVERFLOW  doc=${overflow.docW} view=${overflow.viewW}  -> ${overflow.path}`
          : 'ok'
      }`,
    )
    await page.close()
  }
} finally {
  await browser.close()
}
