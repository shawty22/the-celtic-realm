#!/usr/bin/env node
/**
 * wire-artwork.js
 *
 * Scans public/assets/ and sets imageFile in every JSON data file
 * where a matching PNG exists. Safe to re-run — only updates blank fields.
 *
 * Run: node scripts/wire-artwork.js
 */

import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const ASSETS = path.join(ROOT, 'public/assets')
const DATA   = path.join(ROOT, 'src/data')

// Special-case mappings where the JSON id doesn't match the filename 1:1
const OVERRIDES = {
  mythological: {
    'mag-tuired-north': 'mag-tuired.png',   // only one Mag Tuired painting delivered
  },
  ulster: {
    'tain-bo-cuailnge': 'tain.png',         // the location entry uses the full story id
  },
}

function availableFiles(layer) {
  const dir = path.join(ASSETS, layer)
  if (!fs.existsSync(dir)) return new Set()
  return new Set(
    fs.readdirSync(dir)
      .filter(f => f.endsWith('.png') && !f.includes('-4x') && !f.includes('-v1'))
  )
}

function wireLayer(jsonPath, layer) {
  const raw = fs.readFileSync(jsonPath, 'utf8')
  const entries = JSON.parse(raw)
  const files = availableFiles(layer)
  const overrides = OVERRIDES[layer] || {}

  let wired = 0
  for (const entry of entries) {
    // Migrate .webp → .png if the .png version exists
    if (entry.imageFile && entry.imageFile.endsWith('.webp')) {
      const pngName = entry.imageFile.replace(/\.webp$/, '.png')
      if (files.has(pngName)) {
        entry.imageFile = pngName
        wired++
        continue
      }
    }
    if (entry.imageFile) continue   // already set — don't overwrite

    const override = overrides[entry.id]
    if (override && files.has(override)) {
      entry.imageFile = override
      wired++
    } else {
      const candidate = `${entry.id}.png`
      if (files.has(candidate)) {
        entry.imageFile = candidate
        wired++
      }
    }
  }

  fs.writeFileSync(jsonPath, JSON.stringify(entries, null, 2))
  console.log(`  ${layer.padEnd(16)} ${wired} wired  (${entries.length} entries, ${files.size} files)`)
  return wired
}

function wireCharacters() {
  const jsonPath = path.join(DATA, 'characters.json')
  const raw = fs.readFileSync(jsonPath, 'utf8')
  const data = JSON.parse(raw)
  const files = availableFiles('characters')

  let wired = 0
  for (const char of data.characters) {
    if (char.imageFile) continue
    const candidate = `${char.id}.png`
    if (files.has(candidate)) {
      char.imageFile = candidate
      wired++
    }
  }

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2))
  console.log(`  characters       ${wired} wired  (${data.characters.length} entries, ${files.size} files)`)
  return wired
}

function wireStories() {
  const jsonPath = path.join(DATA, 'stories-catalog.json')
  const raw = fs.readFileSync(jsonPath, 'utf8')
  const stories = JSON.parse(raw)
  const files = availableFiles('stories')

  let wired = 0
  for (const story of stories) {
    if (story.imageFile) continue
    const candidate = `${story.id}.png`
    if (files.has(candidate)) {
      story.imageFile = candidate
      wired++
    }
  }

  fs.writeFileSync(jsonPath, JSON.stringify(stories, null, 2))
  console.log(`  stories          ${wired} wired  (${stories.length} entries, ${files.size} files)`)
  return wired
}

// Main
console.log('\n  Wiring artwork to JSON data files...\n')

let total = 0
total += wireCharacters()
total += wireStories()
total += wireLayer(path.join(DATA, 'mythological.json'), 'mythological')
total += wireLayer(path.join(DATA, 'ulster.json'),       'ulster')
total += wireLayer(path.join(DATA, 'fenian.json'),       'fenian')

console.log(`\n  Done — ${total} imageFile fields wired.\n`)
