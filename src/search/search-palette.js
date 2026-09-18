/**
 * search-palette.js — S10: command-palette search
 * Opens on ⌘K / Ctrl+K or "/" when no input is focused.
 * Searches: stories, characters, atlas places, artwork chapters.
 */

import catalog       from '../data/stories-catalog.json'
import charData      from '../data/characters.json'
import mythData      from '../data/mythological.json'
import ulsterData    from '../data/ulster.json'
import fenianData    from '../data/fenian.json'
import gfmSections   from '../source/gods-and-fighting-men-sections.json'

const chars  = charData.characters
const places = [...mythData, ...ulsterData, ...fenianData]

// ── Index build ──────────────────────────────────────────────────────────── //

const _index = []

function _n(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

catalog.forEach(s => {
  const kw = [s.title, s.titleSub, s.hook, ...(s.cast || [])].join(' ')
  _index.push({ type: 'story', id: s.id, label: s.title, sub: s.titleSub || s.cycleLabel || '', cycle: s.cycle, norm: _n(kw) })
})

chars.forEach(c => {
  const kw = [c.name, c.nameAlternate, c.nameIrish, c.title, c.summary].join(' ')
  _index.push({ type: 'character', id: c.id, label: c.name, sub: c.title || '', cycle: c.cycle, norm: _n(kw) })
})

places.forEach(p => {
  const kw = [p.name, p.nameIrish, p.shortSummary, p.county].join(' ')
  _index.push({ type: 'place', id: p.id, label: p.name, sub: p.county ? `Co. ${p.county}` : '', cycle: p.cycle, norm: _n(kw) })
})

gfmSections.forEach(s => {
  const label = s.chapter || s.part || s.id
  const kw = [label, s.book, s.part, s.id].join(' ')
  _index.push({ type: 'chapter', id: s.id, label, sub: s.book ? s.book.replace(/^BOOK\s+\w+:\s*/i, '') : 'Lady Gregory', cycle: '', norm: _n(kw) })
})

// ── State ─────────────────────────────────────────────────────────────────── //

let _el = null
let _inputEl = null
let _resultsEl = null
let _isOpen = false
let _selectedIdx = -1
let _results = []

// ── Public ────────────────────────────────────────────────────────────────── //

export function initSearch() {
  _el = document.getElementById('search-palette')
  if (!_el) return
  _inputEl   = _el.querySelector('#search-input')
  _resultsEl = _el.querySelector('#search-results')

  _el.querySelector('.search-backdrop')?.addEventListener('click', closeSearch)
  _el.querySelector('.search-close-btn')?.addEventListener('click', closeSearch)

  _inputEl?.addEventListener('input', _onInput)
  _inputEl?.addEventListener('keydown', _onKey)

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      _isOpen ? closeSearch() : openSearch()
      return
    }
    if (e.key === '/' && !_activeInput()) {
      e.preventDefault()
      openSearch()
    }
  })
}

export function openSearch(prefill = '') {
  _isOpen = true
  _el?.classList.add('is-open')
  _el?.removeAttribute('aria-hidden')
  document.body.classList.add('search-active')
  if (_inputEl) {
    _inputEl.value = prefill
    setTimeout(() => _inputEl.focus(), 30)
  }
  _runSearch(prefill)
}

export function closeSearch() {
  _isOpen = false
  _el?.classList.remove('is-open')
  _el?.setAttribute('aria-hidden', 'true')
  document.body.classList.remove('search-active')
  if (_inputEl) _inputEl.value = ''
  if (_resultsEl) _resultsEl.innerHTML = ''
  _results = []
  _selectedIdx = -1
}

// ── Internal ──────────────────────────────────────────────────────────────── //

function _onInput(e) {
  _runSearch(e.target.value)
}

function _onKey(e) {
  if (e.key === 'Escape') { closeSearch(); return }
  if (e.key === 'ArrowDown') { e.preventDefault(); _move(1) }
  if (e.key === 'ArrowUp')   { e.preventDefault(); _move(-1) }
  if (e.key === 'Enter')     { e.preventDefault(); _select(_selectedIdx) }
}

function _move(dir) {
  if (!_results.length) return
  _selectedIdx = (_selectedIdx + dir + _results.length) % _results.length
  _renderResults()
  _resultsEl?.querySelector('.search-result.is-selected')?.scrollIntoView({ block: 'nearest' })
}

function _runSearch(q) {
  _selectedIdx = -1
  const term = _n(q.trim())
  if (!term) {
    _results = _defaultResults()
  } else {
    // Match all words in query (allows partial: "cuchulain" matches "cu chulainn")
    const words = term.replace(/\s+/g, '').length < 6
      ? [term]  // short query: substring match
      : term.split(/\s+/).filter(Boolean)
    _results = _index
      .filter(r => words.every(w => r.norm.includes(w)) || r.norm.replace(/\s+/g, '').includes(term.replace(/\s+/g, '')))
      .slice(0, 24)
  }
  _renderResults()
}

function _defaultResults() {
  // Show first 6 stories as suggestions
  return _index.filter(r => r.type === 'story').slice(0, 6)
}

function _renderResults() {
  if (!_resultsEl) return
  if (!_results.length) {
    _resultsEl.innerHTML = '<p class="search-empty">No results</p>'
    return
  }

  const cycleColors = { mythological: '#7a5ead', ulster: '#c8703a', fenian: '#3a8a6e', historical: '#8a7a5a' }
  const typeIcon = { story: '📖', character: '⚔️', place: '📍', chapter: '📜' }
  const typeLabel = { story: 'Story', character: 'Character', place: 'Place', chapter: 'Chapter' }

  _resultsEl.innerHTML = _results.map((r, i) => `
    <button class="search-result ${i === _selectedIdx ? 'is-selected' : ''}" data-idx="${i}">
      <span class="search-result-icon">${typeIcon[r.type]}</span>
      <span class="search-result-body">
        <span class="search-result-label">${_esc(r.label)}</span>
        <span class="search-result-sub">${_esc(r.sub)}</span>
      </span>
      <span class="search-result-badge" style="background:${cycleColors[r.cycle] || '#3a3226'}">${typeLabel[r.type]}</span>
    </button>
  `).join('')

  _resultsEl.querySelectorAll('.search-result').forEach(btn => {
    btn.addEventListener('click', () => _select(parseInt(btn.dataset.idx)))
    btn.addEventListener('mouseenter', () => {
      _selectedIdx = parseInt(btn.dataset.idx)
      _resultsEl.querySelectorAll('.search-result').forEach((b, i) => b.classList.toggle('is-selected', i === _selectedIdx))
    })
  })
}

function _select(idx) {
  const r = _results[idx]
  if (!r) return
  closeSearch()

  switch (r.type) {
    case 'story':
      document.dispatchEvent(new CustomEvent('search:openStory', { detail: { storyId: r.id } }))
      break
    case 'character':
      document.dispatchEvent(new CustomEvent('search:openChar', { detail: { charId: r.id } }))
      break
    case 'place':
      document.dispatchEvent(new CustomEvent('search:openPlace', { detail: { placeId: r.id } }))
      break
    case 'chapter':
      document.dispatchEvent(new CustomEvent('reader:openChapter', { detail: { chapterId: r.id } }))
      break
  }
}

function _activeInput() {
  const el = document.activeElement
  return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
}

function _esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])
  )
}
