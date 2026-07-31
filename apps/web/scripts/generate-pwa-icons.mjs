#!/usr/bin/env node
import sharp from 'sharp'
import { readFileSync } from 'node:fs'

const svg = readFileSync('public/favicon.svg')

async function write(size, name, { maskable = false } = {}) {
  let pipeline = sharp(svg).resize(size, size)
  if (maskable) {
    const padded = await sharp(svg)
      .resize(Math.round(size * 0.8), Math.round(size * 0.8))
      .png()
      .toBuffer()
    pipeline = sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 58, g: 109, b: 76, alpha: 1 },
      },
    }).composite([{ input: padded, gravity: 'centre' }])
  }
  await pipeline.png().toFile(`public/${name}`)
  console.log('wrote', name)
}

await write(192, 'pwa-192x192.png')
await write(512, 'pwa-512x512.png')
await write(512, 'pwa-512x512-maskable.png', { maskable: true })
await write(180, 'apple-touch-icon.png')
