/**
 * chars-screen.js — S04: Characters browser
 * Full-screen encyclopedia of all characters, filterable by cycle + search.
 * Opens existing openCharModal on click.
 */

import charData from '../data/characters.json'
import { openCharModal } from '../atlas/characters.js'

const chars = charData.characters

let _el = null
let _isOpen = false
let _filter = 'all'
let _query = ''

export function initCharsScreen() {
  _el = document.getElementById('chars-screen')
  if (!_el) return

  document.getElementById('chars-screen-close')?.addEventListener('click', closeCharsScreen)
  document.querySelector('.chars-backdrop')?.addEventListener('click', closeCharsScreen)

  // Cycle tabs
  _el.querySelectorAll('.chars-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      _filter = tab.dataset.cycle
      _el.querySelectorAll('.chars-tab').forEach(t => t.classList.toggle('is-active', t === tab))
      _render()
    })
  })

  // Search
  const searchEl = document.getElementById('chars-search')
  searchEl?.addEventListener('input', e => {
    _query = e.target.value.toLowerCase().trim()
    _render()
  })

  // Delegated click for character cards
  document.getElementById('chars-grid')?.addEventListener('click', e => {
    const card = e.target.closest('[data-char-id]')
    if (card) {
      openCharModal(card.dataset.charId, null)
    }
  })

  document.addEventListener('keydown', e => {
    if (!_isOpen) return
    if (e.key === 'Escape') closeCharsScreen()
  })

  _render()
}

export function openCharsScreen() {
  _isOpen = true
  _el?.classList.add('is-open')
  _el?.removeAttribute('aria-hidden')
  document.body.classList.add('chars-active')
  document.getElementById('chars-search')?.focus()
}

export function closeCharsScreen() {
  _isOpen = false
  _el?.classList.remove('is-open')
  _el?.setAttribute('aria-hidden', 'true')
  document.body.classList.remove('chars-active')
}

// ── Render ──────────────────────────────────────────────────────────────── //

const CYCLE_COLORS = { mythological: '#7a5ead', ulster: '#c8703a', fenian: '#3a8a6e' }
const CYCLE_LABEL  = { mythological: 'Mythological', ulster: 'Ulster', fenian: 'Fenian' }

function _render() {
  const grid = document.getElementById('chars-grid')
  if (!grid) return

  const list = chars.filter(c => {
    if (_filter !== 'all' && c.cycle !== _filter) return false
    if (_query) {
      const hay = [c.name, c.title, c.nameIrish, ...(c.nameAlternate || [])].join(' ').toLowerCase()
      if (!hay.includes(_query)) return false
    }
    return true
  })

  // Group by cycle for "all" view
  if (_filter === 'all' && !_query) {
    const groups = {}
    for (const c of list) {
      const cy = c.cycle || 'other'
      if (!groups[cy]) groups[cy] = []
      groups[cy].push(c)
    }
    const order = ['mythological', 'ulster', 'fenian']
    grid.innerHTML = order.filter(k => groups[k]).map(cy =>
      `<div class="chars-group">
        <h3 class="chars-group-label" style="color:${CYCLE_COLORS[cy]}">${CYCLE_LABEL[cy]} Cycle</h3>
        <div class="chars-group-grid">${groups[cy].map(_cardHTML).join('')}</div>
      </div>`
    ).join('')
  } else {
    grid.innerHTML = list.length
      ? `<div class="chars-group"><div class="chars-group-grid">${list.map(_cardHTML).join('')}</div></div>`
      : `<p class="chars-empty">No characters match "${_esc(_query)}"</p>`
  }
}

function _cardHTML(c) {
  const color = CYCLE_COLORS[c.cycle] || '#888'
  const label = CYCLE_LABEL[c.cycle] || ''
  const imgSrc = c.imageFile ? `/assets/characters/${_esc(c.imageFile)}` : ''

  return `
    <button class="chars-card" data-char-id="${_esc(c.id)}" aria-label="${_esc(c.name)}, ${_esc(c.title)}">
      <div class="chars-card-art" style="--char-glow:${c.palette?.glow || color}">
        ${imgSrc
          ? `<img src="${imgSrc}" alt="${_esc(c.name)}" class="chars-card-img" loading="lazy"
               onerror="this.closest('.chars-card-art').classList.add('no-art')" />`
          : `<span class="chars-card-glyph">${_cycleGlyph(c.cycle)}</span>`}
        <div class="chars-card-glow"></div>
      </div>
      <div class="chars-card-info">
        <div class="chars-card-cycle" style="background:${color}">${_esc(label)}</div>
        <span class="chars-card-name">${_esc(c.name)}</span>
        <span class="chars-card-title">${_esc(c.title)}</span>
      </div>
    </button>
  `
}

function _cycleGlyph(cycle) {
  return { mythological: '✦', ulster: '⚔', fenian: '◈' }[cycle] || '◎'
}

function _esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])
  )
}
