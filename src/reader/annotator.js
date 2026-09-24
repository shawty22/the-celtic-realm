/**
 * annotator.js — enriched reader text annotation
 *
 * Builds a sorted name→entity index from:
 *   1. Main characters (characters.json)
 *   2. Atlas place entries (mythological/ulster/fenian)
 *   3. Reader-specific aliases and group stubs (reader-entities.json)
 *
 * annotateText(rawText) wraps known names in <span class="er-token …"> elements.
 * The spans are always in the DOM; the `reader-enriched` body class makes them visible.
 */

import charData      from '../data/characters.json'
import mythData      from '../data/mythological.json'
import ulsterData    from '../data/ulster.json'
import fenianData    from '../data/fenian.json'
import readerEntities from '../data/reader-entities.json'

// ── Enriched mode toggle ──────────────────────────────────────────────────── //

const LS_KEY = 'cr-enriched-mode'

export function isEnrichedMode() {
  try { return localStorage.getItem(LS_KEY) === '1' } catch { return false }
}

export function setEnrichedMode(on) {
  try { localStorage.setItem(LS_KEY, on ? '1' : '0') } catch {}
  document.body.classList.toggle('reader-enriched', on)
}

export function initEnrichedMode() {
  document.body.classList.toggle('reader-enriched', isEnrichedMode())
}

// ── Entity registry ───────────────────────────────────────────────────────── //

// Full entity record shape:
// { id, type: 'char'|'place'|'people'|'group', cycle, name, title, summary, imageFile, hasArt }

let _entityMap = null   // id → entity
let _index     = null   // [{matchName, entity}] sorted longest-first

function _buildIndex() {
  if (_index) return _index
  _entityMap = new Map()
  const pairs = []  // {matchName, entity}

  const _add = (matchName, entity) => {
    if (!matchName || matchName.length < 3) return
    if (!_entityMap.has(entity.id)) _entityMap.set(entity.id, entity)
    pairs.push({ matchName, entity })
  }

  // 1. Main characters
  const chars = charData.characters
  for (const c of chars) {
    const entity = {
      id: c.id, type: 'char', cycle: c.cycle,
      name: c.name, title: c.title,
      summary: c.summary || c.plain || '',
      imageFile: c.imageFile || null,
      hasArt: !!c.imageFile,
    }
    _add(c.name, entity)
    if (Array.isArray(c.nameAlternate)) {
      for (const alt of c.nameAlternate) _add(alt, entity)
    }
  }

  // 2. Reader aliases → existing chars  (short text spellings like "Finn" → fionn)
  const aliases = readerEntities.charAliases || {}
  for (const [spelling, charId] of Object.entries(aliases)) {
    const char = chars.find(c => c.id === charId)
    if (!char) continue
    const entity = _entityMap.get(charId) || {
      id: char.id, type: 'char', cycle: char.cycle,
      name: char.name, title: char.title,
      summary: char.summary || char.plain || '',
      imageFile: char.imageFile || null,
      hasArt: !!char.imageFile,
    }
    _add(spelling, entity)
  }

  // 3. Reader groups / peoples
  for (const g of (readerEntities.groups || [])) {
    const entity = {
      id: g.id, type: g.type || 'people', cycle: g.cycle || null,
      name: g.name, title: g.title, summary: g.summary,
      imageFile: null, hasArt: false,
    }
    for (const mn of (g.matchNames || [g.name])) _add(mn, entity)
  }

  // 4. Reader minor characters
  for (const mc of (readerEntities.minorChars || [])) {
    const entity = {
      id: mc.id, type: 'char', cycle: mc.cycle || null,
      name: mc.name, title: mc.title, summary: mc.summary,
      imageFile: mc.imageFile || null, hasArt: false,
    }
    for (const mn of (mc.matchNames || [mc.name])) _add(mn, entity)
  }

  // 5. Atlas place entries
  const allPlaces = [...mythData, ...ulsterData, ...fenianData]
  for (const p of allPlaces) {
    if (!p.name) continue
    const entity = {
      id: p.id, type: 'place', cycle: p.layer || null,
      name: p.name, title: p.type || 'Place',
      summary: p.description || p.summary || '',
      imageFile: null, hasArt: false,
    }
    _add(p.name, entity)
    // Also add nameIrish if present
    if (p.nameIrish) _add(p.nameIrish, entity)
  }

  // Sort longest-match first to prevent "Lugh" matching inside "Lugh Lámhfhada"
  pairs.sort((a, b) => b.matchName.length - a.matchName.length)
  _index = pairs
  return _index
}

// ── Text annotation ───────────────────────────────────────────────────────── //

const _isLetterish = c => c && /[\wÀ-ɏ]/.test(c)

export function annotateText(rawText) {
  const index = _buildIndex()
  const found = []  // [startIdx, endIdx, entity, matchName]

  for (const { matchName, entity } of index) {
    let pos = 0
    while (pos < rawText.length) {
      const idx = rawText.indexOf(matchName, pos)
      if (idx === -1) break
      const before = idx > 0 ? rawText[idx - 1] : ''
      const after  = rawText[idx + matchName.length] || ''
      if (!_isLetterish(before) && !_isLetterish(after)) {
        const end = idx + matchName.length
        if (!found.some(r => idx < r[1] && end > r[0])) {
          found.push([idx, end, entity, matchName])
        }
      }
      pos = idx + 1
    }
  }

  found.sort((a, b) => a[0] - b[0])

  let result = ''
  let last = 0
  for (const [start, end, entity, matchName] of found) {
    result += _esc(rawText.slice(last, start))
    const cls = `er-token er-${entity.type}${entity.hasArt ? ' er-has-art' : ''}`
    result += `<span class="${cls}" data-er-id="${_esc(entity.id)}"` +
              ` data-er-type="${entity.type}"` +
              ` data-er-name="${_esc(entity.name)}">${_esc(matchName)}</span>`
    last = end
  }
  result += _esc(rawText.slice(last))
  return result
}

// Return entity record by id (for tooltip lookups)
export function getEntity(id) {
  _buildIndex()
  return _entityMap?.get(id) || null
}

function _esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}
