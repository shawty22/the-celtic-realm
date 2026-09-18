/**
 * reader.js — READ view (S02)
 * iPad-first: landscape = 65% text / 35% living margin
 * Portrait/iPhone = text first, margin cards stack below
 */

import sections from '../source/gods-and-fighting-men-sections.json'
import provenance from '../source/provenance.json'
import storyChapterMap from '../data/story-chapter-map.json'
import catalog from '../data/stories-catalog.json'
import chapterEntities from '../data/chapter-entities.json'
import charData from '../data/characters.json'

let readerEl = null
let currentIdx = 0
let isOpen = false
let onCloseCb = null

// Reverse map: chapter id → array of story catalog entries
const _chapStories = {}
for (const [storyId, chapterIds] of Object.entries(storyChapterMap)) {
  if (storyId.startsWith('_')) continue
  const story = catalog.find(s => s.id === storyId)
  if (!story) continue
  for (const cid of chapterIds) {
    if (!_chapStories[cid]) _chapStories[cid] = []
    _chapStories[cid].push(story)
  }
}

// ── Build DOM ────────────────────────────────────────────────────────────── //

export function initReader(onClose) {
  onCloseCb = onClose
  readerEl = document.getElementById('reader-screen')
  if (!readerEl) return

  _buildLibrary()
  _buildReadingPane()

  document.getElementById('reader-close')?.addEventListener('click', closeReader)
  document.addEventListener('keydown', _onKey)
}

function _buildLibrary() {
  const lib = document.getElementById('reader-library')
  if (!lib) return

  // Group by Part → Book
  const grouped = {}
  for (const s of sections) {
    const part = s.part || 'Part One: The Gods.'
    const book = s.book || 'Book One'
    if (!grouped[part]) grouped[part] = {}
    if (!grouped[part][book]) grouped[part][book] = []
    grouped[part][book].push(s)
  }

  let html = ''
  for (const [part, books] of Object.entries(grouped)) {
    html += `<div class="lib-part"><h3 class="lib-part-title">${_fmt(part)}</h3>`
    for (const [book, chaps] of Object.entries(books)) {
      html += `<div class="lib-book"><h4 class="lib-book-title">${_fmt(book)}</h4><ul class="lib-chap-list">`
      for (const s of chaps) {
        const preview = s.body.replace(/\n/g, ' ').slice(0, 80).trim()
        html += `<li class="lib-chap-item" data-id="${s.id}">
          <button class="lib-chap-btn" data-id="${s.id}">
            <span class="lib-chap-name">${_fmt(s.chapter)}</span>
            <span class="lib-chap-preview">${preview}…</span>
          </button>
        </li>`
      }
      html += `</ul></div>`
    }
    html += `</div>`
  }

  lib.innerHTML = html

  lib.addEventListener('click', e => {
    const btn = e.target.closest('[data-id]')
    if (!btn) return
    const idx = sections.findIndex(s => s.id === btn.dataset.id)
    if (idx >= 0) _openChapter(idx)
  })
}

function _buildReadingPane() {
  // Pane is pre-rendered in HTML; we populate it dynamically
  document.getElementById('reader-prev')?.addEventListener('click', () => _openChapter(currentIdx - 1))
  document.getElementById('reader-next')?.addEventListener('click', () => _openChapter(currentIdx + 1))
}

// ── Open / close ─────────────────────────────────────────────────────────── //

export function openReaderAtChapter(chapterId) {
  const idx = sections.findIndex(s => s.id === chapterId)
  if (idx < 0) { openReader(); return }
  isOpen = true
  readerEl?.classList.add('is-open')
  readerEl?.removeAttribute('aria-hidden')
  document.body.classList.add('reader-active')
  _openChapter(idx)
}

export function openReader() {
  isOpen = true
  readerEl?.classList.add('is-open')
  readerEl?.removeAttribute('aria-hidden')
  document.body.classList.add('reader-active')
  // Start at library view (no chapter open)
  _showLibrary()
}

export function closeReader() {
  isOpen = false
  readerEl?.classList.remove('is-open')
  readerEl?.setAttribute('aria-hidden', 'true')
  document.body.classList.remove('reader-active')
  onCloseCb?.()
}

// ── Chapter navigation ───────────────────────────────────────────────────── //

function _openChapter(idx) {
  if (idx < 0 || idx >= sections.length) return
  currentIdx = idx
  const s = sections[idx]

  // Mark active in library
  document.querySelectorAll('.lib-chap-btn').forEach(b => {
    b.classList.toggle('is-active', b.dataset.id === s.id)
  })

  // Switch to reading pane on small screens
  _showPane()

  // Populate text
  const titleEl = document.getElementById('reader-chapter-title')
  const metaEl  = document.getElementById('reader-chapter-meta')
  const bodyEl  = document.getElementById('reader-chapter-body')
  const srcEl   = document.getElementById('reader-source-note')

  if (titleEl) titleEl.textContent = _fmt(s.chapter)
  if (metaEl)  metaEl.textContent  = `${_fmt(s.book)} · ${_fmt(s.part)}`
  if (bodyEl)  bodyEl.innerHTML    = _renderBody(s.body)
  if (srcEl)   srcEl.innerHTML     = _sourceNote()

  // Nav buttons
  const prev = document.getElementById('reader-prev')
  const next = document.getElementById('reader-next')
  if (prev) prev.disabled = idx === 0
  if (next) next.disabled = idx === sections.length - 1

  // Counter
  const ctr = document.getElementById('reader-counter')
  if (ctr) ctr.textContent = `${idx + 1} / ${sections.length}`

  // Populate living margin with related story cards
  _updateMargin(s.id)

  // Scroll text to top
  bodyEl?.scrollTo(0, 0)
  document.getElementById('reader-pane')?.scrollTo(0, 0)

  // Save reading position
  try { localStorage.setItem('cr-reader-pos', s.id) } catch {}
}

const _allChars = charData.characters

function _updateMargin(chapterId) {
  const inner = document.getElementById('reader-margin-inner')
  if (!inner) return

  const stories  = _chapStories[chapterId] || []
  const entities = chapterEntities[chapterId] || {}
  const charIds  = entities.chars || []
  const locId    = entities.locationId || null
  const chars    = charIds.map(id => _allChars.find(c => c.id === id)).filter(Boolean)

  const cycleColors = { mythological: '#7a5ead', ulster: '#c8703a', fenian: '#3a8a6e' }

  if (!stories.length && !chars.length && !locId) {
    inner.innerHTML = `<p class="reader-margin-hint">Characters, places, and artwork will appear here as you read.</p>`
    return
  }

  let html = ''

  // Characters section
  if (chars.length) {
    html += `<p class="margin-section-label">In this chapter</p>
    <div class="margin-char-chips">${chars.map(c => `
      <button class="margin-char-chip" data-char-id="${_esc(c.id)}"
        style="--chip-color:${c.palette?.glow || cycleColors[c.cycle] || '#888'}">
        ${c.imageFile
          ? `<img src="/assets/characters/${_esc(c.imageFile)}" alt="${_esc(c.name)}" class="margin-chip-img"
               onerror="this.style.display='none'">`
          : `<span class="margin-chip-glyph">${c.cycle === 'mythological' ? '✦' : c.cycle === 'ulster' ? '⚔' : '◈'}</span>`}
        <span class="margin-chip-name">${_esc(c.name)}</span>
      </button>
    `).join('')}</div>`
  }

  // Atlas location link
  if (locId) {
    html += `<button class="margin-atlas-btn" data-loc="${_esc(locId)}">View on Atlas →</button>`
  }

  // Stories section
  if (stories.length) {
    html += `<p class="margin-section-label">Related Stories</p>
    ${stories.map(s => `
      <div class="margin-story-card">
        <div class="margin-story-cycle" style="background:${cycleColors[s.cycle] || '#555'}">${_esc(s.cycleLabel)}</div>
        <h4 class="margin-story-title">${_esc(s.title)}</h4>
        <p class="margin-story-hook">${_esc(s.hook)}</p>
        <button class="margin-story-btn" data-story="${_esc(s.id)}">Follow on the map →</button>
      </div>
    `).join('')}`
  }

  inner.innerHTML = html

  // Wire up character chips → open character modal
  inner.querySelectorAll('.margin-char-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('reader:openChar', { detail: { charId: btn.dataset.charId } }))
    })
  })

  // Atlas button → close reader, fly to location
  inner.querySelectorAll('.margin-atlas-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      closeReader()
      document.dispatchEvent(new CustomEvent('atlas:flyToLocation', { detail: { locationId: btn.dataset.loc } }))
    })
  })

  // Story buttons
  inner.querySelectorAll('.margin-story-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      closeReader()
      document.dispatchEvent(new CustomEvent('atlas:enterStory', { detail: { storyId: btn.dataset.story, beatIndex: 0 } }))
    })
  })
}

function _esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

function _showLibrary() {
  document.getElementById('reader-library-col')?.classList.remove('pane-active')
  document.getElementById('reader-pane')?.classList.remove('pane-active')
  // On wide screens both columns always visible; on narrow, show library
  document.getElementById('reader-library-col')?.classList.add('col-visible')
  document.getElementById('reader-pane')?.classList.remove('col-visible')

  // Restore last position
  try {
    const saved = localStorage.getItem('cr-reader-pos')
    if (saved) {
      const idx = sections.findIndex(s => s.id === saved)
      if (idx >= 0) _openChapter(idx)
      return
    }
  } catch {}
  // Default: first chapter
  _openChapter(0)
}

function _showPane() {
  document.getElementById('reader-library-col')?.classList.remove('col-visible')
  document.getElementById('reader-pane')?.classList.add('col-visible')
}

// ── Helpers ──────────────────────────────────────────────────────────────── //

function _fmt(str) {
  if (!str) return ''
  return str
    .replace(/^(PART|BOOK|CHAPTER)\s+/i, m => m)
    .replace(/\.$/, '')
    .trim()
}

function _renderBody(text) {
  return text
    .split(/\n{2,}/)
    .map(para => para.trim())
    .filter(Boolean)
    .map(para => `<p>${para.replace(/\n/g, ' ')}</p>`)
    .join('\n')
}

function _sourceNote() {
  const src = provenance.sources[0]
  return `<em>${src.title}</em> by ${src.author} (${src.year}). ${src.publisher}.
    Source: <a href="${src.acquisition.url}" target="_blank" rel="noopener">Project Gutenberg #${src.acquisition.ebook_id}</a>.
    Public domain.`
}

function _onKey(e) {
  if (!isOpen) return
  if (e.key === 'Escape') closeReader()
  if (e.key === 'ArrowRight') _openChapter(currentIdx + 1)
  if (e.key === 'ArrowLeft')  _openChapter(currentIdx - 1)
}
