/**
 * reader.js — READ view (S02)
 * iPad-first: landscape = 65% text / 35% living margin
 * Portrait/iPhone = text first, margin cards stack below
 */

import sections from '../source/gods-and-fighting-men-sections.json'
import modernText from '../source/gods-and-fighting-men-modern.json'
import provenance from '../source/provenance.json'
import storyChapterMap from '../data/story-chapter-map.json'
import catalog from '../data/stories-catalog.json'
import chapterEntities from '../data/chapter-entities.json'
import charData from '../data/characters.json'
import { annotateText, isEnrichedMode, setEnrichedMode, initEnrichedMode } from './annotator.js'
import { initTooltip } from './tooltip.js'

let readerEl = null
let currentIdx = 0
let isOpen = false
let onCloseCb = null

// Modern retelling index: id → body_modern
const _modernMap = new Map(modernText.map(e => [e.id, e.body_modern]))

const LS_MODERN = 'cr-modern-mode'
function isModernMode() {
  try {
    const val = localStorage.getItem(LS_MODERN)
    return val === null ? true : val === '1'  // default ON for new visitors
  } catch { return true }
}
function setModernMode(on) { try { localStorage.setItem(LS_MODERN, on ? '1' : '0') } catch {} }

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
  initEnrichedMode()
  initTooltip()

  document.getElementById('reader-close')?.addEventListener('click', closeReader)
  document.addEventListener('keydown', _onKey)

  // Modern retelling toggle
  const modernBtn = document.getElementById('reader-modern-toggle')
  if (modernBtn) {
    _updateModernBtn(modernBtn)
    modernBtn.addEventListener('click', () => {
      setModernMode(!isModernMode())
      _updateModernBtn(modernBtn)
      _rerenderBody()
    })
  }

  // Enriched mode toggle button
  const enrichBtn = document.getElementById('reader-enriched-toggle')
  if (enrichBtn) {
    _updateEnrichedBtn(enrichBtn)
    enrichBtn.addEventListener('click', () => {
      setEnrichedMode(!isEnrichedMode())
      _updateEnrichedBtn(enrichBtn)
    })
  }

  // reader:flyToPlace → close reader and fly atlas
  document.addEventListener('reader:flyToPlace', e => {
    closeReader()
    document.dispatchEvent(new CustomEvent('atlas:flyToLocation', {
      detail: { locationId: e.detail.placeId }
    }))
  })
}

function _updateEnrichedBtn(btn) {
  const on = isEnrichedMode()
  btn.classList.toggle('is-active', on)
  btn.title = on ? 'Switch to traditional reading' : 'Switch to enriched reading (hyperlinks + tooltips)'
  btn.setAttribute('aria-pressed', String(on))
}

function _updateModernBtn(btn) {
  const on = isModernMode()
  btn.classList.toggle('is-active', on)
  btn.title = on ? 'Switch to Lady Gregory original' : 'Switch to modern retelling'
  btn.setAttribute('aria-pressed', String(on))
  const pdfLink = document.getElementById('reader-pdf-link')
  if (pdfLink) {
    pdfLink.href = on
      ? '/downloads/celtic-realm-modern.pdf'
      : '/downloads/celtic-realm-lady-gregory.pdf'
    pdfLink.title = on ? 'Download modern retelling as PDF' : 'Download Lady Gregory original as PDF'
  }
}

function _rerenderBody() {
  const s = sections[currentIdx]
  if (!s) return
  const bodyEl = document.getElementById('reader-chapter-body')
  if (bodyEl) bodyEl.innerHTML = _renderBody(s)
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

  // Continue Reading banner
  let savedBanner = ''
  try {
    const savedId = localStorage.getItem('cr-reader-pos')
    if (savedId) {
      const saved = sections.find(s => s.id === savedId)
      if (saved) {
        savedBanner = `<div class="lib-continue-banner">
          <span class="lib-continue-label">Continue reading</span>
          <button class="lib-continue-btn" data-id="${savedId}">${_fmt(saved.chapter)}</button>
        </div>`
      }
    }
  } catch {}

  let html = savedBanner
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
  // Restore last reading position, or show library
  try {
    const saved = localStorage.getItem('cr-reader-pos')
    if (saved) {
      const idx = sections.findIndex(s => s.id === saved)
      if (idx >= 0) { _openChapter(idx); return }
    }
  } catch {}
  _showLibrary()
}

export function closeReader(silent = false) {
  isOpen = false
  readerEl?.classList.remove('is-open')
  readerEl?.setAttribute('aria-hidden', 'true')
  document.body.classList.remove('reader-active')
  if (!silent) onCloseCb?.()
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
  if (bodyEl)  bodyEl.innerHTML    = _renderBody(s)
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

function _renderBody(s) {
  const text = (isModernMode() && _modernMap.get(s.id)) ? _modernMap.get(s.id) : s.body
  return text
    .split(/\n{2,}/)
    .map(para => para.trim())
    .filter(Boolean)
    .map(para => `<p>${annotateText(para.replace(/\n/g, ' '))}</p>`)
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
