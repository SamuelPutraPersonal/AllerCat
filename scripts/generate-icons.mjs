import sharp from 'sharp'
import { readFileSync } from 'node:fs'

const svg = readFileSync('public/icon.svg')
const targets = [
  ['pwa-192x192.png', 192],
  ['pwa-512x512.png', 512],
  ['apple-touch-icon.png', 180],
]
for (const [file, size] of targets) {
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(`public/${file}`)
  console.log('wrote', file)
}
