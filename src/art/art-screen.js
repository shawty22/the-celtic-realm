/**
 * art-screen.js — S06: ART library
 * Full-screen gallery of story artworks with lightbox viewer.
 */

import catalog from '../data/stories-catalog.json'

const CYCLE_COLORS = { mythological: '#7a5ead', ulster: '#c8703a', fenian: '#3a8a6e' }
const CYCLE_LABEL  = { mythological: 'Mythological', ulster: 'Ulster', fenian: 'Fenian' }

// Story artworks — the primary illustrated pieces
const artworks = catalog
  .filter(s => s.imageFile)
  .map(s => ({
    id:          s.id,
    title:       s.title,
    titleSub:    s.titleSub || '',
    cycle:       s.cycle,
    cycleLabel:  s.cycleLabel || CYCLE_LABEL[s.cycle] || s.cycle,
    hook:        s.hook,
    description: s.description || s.plain || '',
    src:         `/assets/stories/${s.imageFile}`,
    src4x:       `/assets/stories/${s.imageFile.replace('.png', '-4x.png')}`,
  }))

let _el = null
let _lightboxEl = null
let _isOpen = false
let _lightboxOpen = false
let _filter = 'all'
let _activePiece = null

export function initArtScreen() {
  _el = document.getElementById('art-screen')
  _lightboxEl = document.getElementById('art-lightbox')
  if (!_el) return

  document.getElementById('art-screen-close')?.addEventListener('click', closeArtScreen)
  document.querySelector('.art-backdrop')?.addEventListener('click', closeArtScreen)
  document.getElementById('art-lightbox-close')?.addEventListener('click', _closeLightbox)
  document.querySelector('.art-lb-backdrop')?.addEventListener('click', _closeLightbox)

  // Cycle tabs
  _el.querySelectorAll('.art-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      _filter = tab.dataset.cycle
      _el.querySelectorAll('.art-tab').forEach(t => t.classList.toggle('is-active', t === tab))
      _render()
    })
  })

  document.getElementById('art-grid')?.addEventListener('click', e => {
    const card = e.target.closest('[data-art-id]')
    if (card) _openLightbox(card.dataset.artId)
  })

  document.getElementById('art-lb-story-btn')?.addEventListener('click', () => {
    if (_activePiece) {
      _closeLightbox()
      closeArtScreen()
      document.dispatchEvent(new CustomEvent('atlas:enterStory', {
        detail: { storyId: _activePiece.id, beatIndex: 0 }
      }))
    }
  })

  document.addEventListener('keydown', e => {
    if (_lightboxOpen) {
      if (e.key === 'Escape') _closeLightbox()
      if (e.key === 'ArrowRight') _shiftLightbox(1)
      if (e.key === 'ArrowLeft')  _shiftLightbox(-1)
    } else if (_isOpen && e.key === 'Escape') {
      closeArtScreen()
    }
  })

  document.getElementById('art-lb-prev')?.addEventListener('click', () => _shiftLightbox(-1))
  document.getElementById('art-lb-next')?.addEventListener('click', () => _shiftLightbox(1))

  _render()
}

export function openArtAtPiece(artId) {
  openArtScreen()
  _openLightbox(artId)
}

export function openArtScreen() {
  _isOpen = true
  _el?.classList.add('is-open')
  _el?.removeAttribute('aria-hidden')
  document.body.classList.add('art-active')
}

export function closeArtScreen() {
  _isOpen = false
  _el?.classList.remove('is-open')
  _el?.setAttribute('aria-hidden', 'true')
  document.body.classList.remove('art-active')
  _closeLightbox()
}

// ── Render grid ─────────────────────────────────────────────────────────── //

function _render() {
  const grid = document.getElementById('art-grid')
  if (!grid) return

  const list = _filter === 'all'
    ? artworks
    : artworks.filter(a => a.cycle === _filter)

  grid.innerHTML = list.map(a => `
    <button class="art-card" data-art-id="${_esc(a.id)}" aria-label="${_esc(a.title)}">
      <div class="art-card-img-wrap">
        <img src="${_esc(a.src)}" alt="${_esc(a.title)}" class="art-card-img" loading="lazy"
          onerror="this.closest('.art-card').style.display='none'" />
        <div class="art-card-overlay">
          <div class="art-card-cycle" style="background:${CYCLE_COLORS[a.cycle] || '#555'}">${_esc(a.cycleLabel)}</div>
          <h3 class="art-card-title">${_esc(a.title)}</h3>
          <p class="art-card-sub">${_esc(a.titleSub)}</p>
        </div>
      </div>
    </button>
  `).join('')
}

// ── Lightbox ─────────────────────────────────────────────────────────────── //

function _openLightbox(artId) {
  const piece = artworks.find(a => a.id === artId)
  if (!piece || !_lightboxEl) return
  _activePiece = piece
  _lightboxOpen = true

  const imgEl = document.getElementById('art-lb-img')
  imgEl.onerror = () => { imgEl.src = piece.src }
  imgEl.src = piece.src4x || piece.src
  document.getElementById('art-lb-cycle').textContent = piece.cycleLabel
  document.getElementById('art-lb-cycle').style.background = CYCLE_COLORS[piece.cycle] || '#555'
  document.getElementById('art-lb-title').textContent = piece.title
  document.getElementById('art-lb-sub').textContent = piece.titleSub
  document.getElementById('art-lb-hook').textContent = piece.hook

  _lightboxEl.classList.add('is-open')
  _lightboxEl.removeAttribute('aria-hidden')
  document.body.classList.add('lightbox-active')
}

function _closeLightbox() {
  _lightboxOpen = false
  _activePiece = null
  _lightboxEl?.classList.remove('is-open')
  _lightboxEl?.setAttribute('aria-hidden', 'true')
  document.body.classList.remove('lightbox-active')
}

function _shiftLightbox(dir) {
  if (!_activePiece) return
  const filtered = _filter === 'all' ? artworks : artworks.filter(a => a.cycle === _filter)
  const idx = filtered.findIndex(a => a.id === _activePiece.id)
  const next = filtered[(idx + dir + filtered.length) % filtered.length]
  if (next) _openLightbox(next.id)
}

function _esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])
  )
}
