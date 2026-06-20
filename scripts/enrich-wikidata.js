#!/usr/bin/env node
/**
 * enrich-wikidata.js
 *
 * Enriches src/data/archaeology.json with real photos and descriptions
 * from Wikidata + Wikimedia Commons.
 *
 * Targets: all 77 sites that have a `wikidata` Q-number in the JSON.
 * After this runs, those sites will have:
 *   - thumbnail: Wikimedia Commons image at 400px width
 *   - wikiUrl: English Wikipedia article (if one exists)
 *   - summary: Wikipedia extract (if article exists)
 *
 * Run: node scripts/enrich-wikidata.js
 * Requires: Node 18+ (native fetch)
 */

import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ARCH_PATH = path.join(__dirname, '../src/data/archaeology.json')

const WIKIDATA_SPARQL = 'https://query.wikidata.org/sparql'
const COMMONS_API     = 'https://commons.wikimedia.org/w/api.php'
const WIKI_API        = 'https://en.wikipedia.org/w/api.php'
const RATE_MS         = 200   // polite delay between API calls

// ── Helpers ────────────────────────────────────────────────────────────────── //

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function fetchJSON(url, headers = {}) {
  const res = await fetch(url, { headers: { 'User-Agent': 'CelticRealmAtlas/1.0 (https://github.com/shawty22/the-celtic-realm)', ...headers } })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  return res.json()
}

// ── Step 1: Batch SPARQL — get images + Wikipedia links for all Q-ids ──────── //

async function getWikidataInfo(qids) {
  const values = qids.map(q => `wd:${q}`).join(' ')
  const query = `
    SELECT ?item ?image ?article ?desc WHERE {
      VALUES ?item { ${values} }
      OPTIONAL { ?item wdt:P18 ?image . }
      OPTIONAL {
        ?article schema:about ?item ;
                 schema:inLanguage "en" ;
                 schema:isPartOf <https://en.wikipedia.org/> .
      }
      OPTIONAL { ?item schema:description ?desc . FILTER(LANG(?desc) = "en") }
    }
  `.trim()

  const url = `${WIKIDATA_SPARQL}?query=${encodeURIComponent(query)}&format=json`
  const data = await fetchJSON(url, { Accept: 'application/sparql-results+json' })

  const result = {}
  for (const row of data.results.bindings) {
    const qid = row.item.value.split('/').pop()
    if (!result[qid]) result[qid] = {}
    if (row.image)   result[qid].commonsFile = decodeURIComponent(row.image.value.split('/').pop())
    if (row.article) result[qid].wikiUrl     = row.article.value
    if (row.desc)    result[qid].wikidataDesc = row.desc.value
  }
  return result
}

// ── Step 2: Get Commons thumbnail URL for a filename ─────────────────────── //

async function getCommonsThumbnail(filename, width = 400) {
  const params = new URLSearchParams({
    action:  'query',
    titles:  `File:${filename}`,
    prop:    'imageinfo',
    iiprop:  'url',
    iiurlwidth: String(width),
    format:  'json',
    origin:  '*',
  })
  const data = await fetchJSON(`${COMMONS_API}?${params}`)
  const pages = Object.values(data.query?.pages || {})
  return pages[0]?.imageinfo?.[0]?.thumburl || null
}

// ── Step 3: Get Wikipedia summary extract for a page title ───────────────── //

async function getWikiSummary(title) {
  const params = new URLSearchParams({
    action:   'query',
    titles:   title,
    prop:     'extracts',
    exintro:  'true',
    explaintext: 'true',
    exsentences: '3',
    format:   'json',
    origin:   '*',
  })
  const data = await fetchJSON(`${WIKI_API}?${params}`)
  const pages = Object.values(data.query?.pages || {})
  const extract = pages[0]?.extract?.trim()
  return extract || null
}

// ── Main ──────────────────────────────────────────────────────────────────── //

async function main() {
  const sites = JSON.parse(fs.readFileSync(ARCH_PATH, 'utf8'))

  const targets = sites.filter(s => s.wikidata && !s.thumbnail)
  console.log(`\n Wikidata enrichment`)
  console.log(`  Total sites:     ${sites.length}`)
  console.log(`  Have wikidata:   ${sites.filter(s => s.wikidata).length}`)
  console.log(`  Need thumbnail:  ${targets.length}`)
  console.log(`  Already done:    ${sites.filter(s => s.thumbnail).length}\n`)

  if (!targets.length) {
    console.log('All wikidata sites already enriched. Done.')
    return
  }

  // Batch SPARQL (Wikidata accepts large VALUE lists fine)
  console.log('  Querying Wikidata SPARQL...')
  const qids = targets.map(s => s.wikidata)
  const wdInfo = await getWikidataInfo(qids)
  await sleep(RATE_MS)

  let enrichedPhotos   = 0
  let enrichedWiki     = 0
  let enrichedSummary  = 0

  for (const site of targets) {
    const info = wdInfo[site.wikidata]
    if (!info) {
      console.log(`  ○ ${site.name} — no Wikidata result`)
      continue
    }

    // Photo via Commons
    if (info.commonsFile && !site.thumbnail) {
      try {
        const thumb = await getCommonsThumbnail(info.commonsFile)
        if (thumb) {
          site.thumbnail = thumb
          enrichedPhotos++
          console.log(`  ✓ photo  ${site.name}`)
        }
        await sleep(RATE_MS)
      } catch (e) {
        console.log(`  ✗ photo  ${site.name}: ${e.message}`)
      }
    }

    // Wikipedia URL
    if (info.wikiUrl && !site.wikiUrl) {
      site.wikiUrl = info.wikiUrl
      enrichedWiki++
    }

    // Wikipedia summary (from wikiUrl page title)
    if (site.wikiUrl && !site.summary) {
      const title = decodeURIComponent(site.wikiUrl.split('/wiki/').pop())
      try {
        const summary = await getWikiSummary(title)
        if (summary) {
          site.summary = summary
          enrichedSummary++
          console.log(`  ✓ summary ${site.name}`)
        }
        await sleep(RATE_MS)
      } catch (e) {
        console.log(`  ✗ summary ${site.name}: ${e.message}`)
      }
    }

    // Wikidata description as fallback
    if (!site.summary && info.wikidataDesc) {
      site.wikidataDesc = info.wikidataDesc
    }
  }

  fs.writeFileSync(ARCH_PATH, JSON.stringify(sites, null, 2))

  console.log(`\n  Done`)
  console.log(`  Photos added:    ${enrichedPhotos}`)
  console.log(`  Wiki URLs added: ${enrichedWiki}`)
  console.log(`  Summaries added: ${enrichedSummary}`)
  console.log(`\n  archaeology.json updated. Run npm run build to apply.\n`)
}

main().catch(e => { console.error(e); process.exit(1) })
