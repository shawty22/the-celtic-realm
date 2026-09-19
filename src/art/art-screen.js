/**
 * art-screen.js — ART view
 * Full library: story illustrations + character portraits + place artwork.
 * All cross-linked: story → story mode on Atlas, character → char modal,
 * place → Atlas flyTo + detail panel.
 */

import catalog    from '../data/stories-catalog.json'
import charData   from '../data/characters.json'
import mythData   from '../data/mythological.json'
import ulsterData from '../data/ulster.json'
import fenianData from '../data/fenian.json'

const CYCLE_COLORS = { mythological: '#7a5ead', ulster: '#c8703a', fenian: '#3a8a6e', creatures: '#2a6a5a' }
const CYCLE_LABEL  = { mythological: 'Mythological', ulster: 'Ulster', fenian: 'Fenian', creatures: 'Creatures' }

// ── Build the unified artwork index ─────────────────────────────────────── //

const _stories = catalog
  .filter(s => s.imageFile)
  .map(s => ({
    type:       'story',
    id:         s.id,
    title:      s.title,
    sub:        s.titleSub || '',
    cycle:      s.cycle,
    cycleLabel: s.cycleLabel || CYCLE_LABEL[s.cycle] || s.cycle,
    hook:       s.hook,
    src:        `/assets/stories/${s.imageFile}`,
    src4x:      `/assets/stories/${s.imageFile.replace(/\.png$/, '-4x.png')}`,
  }))

const _chars = charData.characters
  .filter(c => c.imageFile && /\.png$/i.test(c.imageFile))
  .map(c => ({
    type:       'character',
    id:         c.id,
    title:      c.name,
    sub:        c.title || '',
    cycle:      c.cycle,
    cycleLabel: CYCLE_LABEL[c.cycle] || c.cycle || '',
    hook:       c.summary || '',
    src:        `/assets/characters/${c.imageFile}`,
    src4x:      `/assets/characters/${c.imageFile}`,
  }))

const _allEntries = [...mythData, ...ulsterData, ...fenianData]
const _places = _allEntries
  .filter(p => p.imageFile)
  .map(p => {
    const dir = p.layer === 'mythological' ? 'mythological'
              : p.layer === 'ulster'       ? 'ulster'
              : 'fenian'
    return {
      type:       'place',
      id:         p.id,
      title:      p.name,
      sub:        p.nameIrish || (p.county ? `Co. ${p.county}` : ''),
      cycle:      p.layer,
      cycleLabel: CYCLE_LABEL[p.layer] || p.layer || '',
      hook:       p.shortSummary || '',
      src:        `/assets/${dir}/${p.imageFile}`,
      src4x:      `/assets/${dir}/${p.imageFile.replace(/\.png$/, '-4x.png')}`,
    }
  })

// Creature artwork — indexed by image filename
const _creatureMeta = {
  'abhartach':           { name: 'Abhartach',            sub: 'Undead Chieftain' },
  'banshee':             { name: 'Bean Sídhe',            sub: 'Death Harbinger' },
  'boar-of-ben-bulben':  { name: 'Boar of Ben Bulben',   sub: 'Supernatural Beast' },
  'caoranach':           { name: 'Caoránach',             sub: 'Mother of Demons' },
  'cat-sidhe':           { name: 'Cat Sídhe',             sub: 'Fairy Cat' },
  'dobhar-chu':          { name: 'Dobhar-chú',            sub: 'Water Hound' },
  'donn-cuailnge':       { name: 'Donn Cuailnge',         sub: 'Brown Bull of Cooley' },
  'dullahan':            { name: 'Dullahan',              sub: 'Headless Horseman' },
  'each-uisce':          { name: 'Each Uisce',            sub: 'Water Horse' },
  'fear-gorta':          { name: 'Fear Gorta',            sub: 'Man of Hunger' },
  'finnbhennach':        { name: 'Finnbhennach',          sub: 'White-Horned Bull' },
  'merrow':              { name: 'Merrow',                sub: 'Sea Folk' },
  'puca':                { name: 'Púca',                  sub: 'Shape-Shifter' },
  'salmon-of-knowledge': { name: 'Salmon of Knowledge',  sub: 'Sacred Fish' },
  'selkie':              { name: 'Selkie',                sub: 'Seal Folk' },
  'sluagh':              { name: 'An Sluagh',             sub: 'Host of the Unforgiven Dead' },
  'white-horse':         { name: 'White Horse',           sub: 'Otherworld Steed' },
}
const _creatures = Object.entries(_creatureMeta).map(([slug, meta]) => ({
  type:       'creature',
  id:         slug,
  title:      meta.name,
  sub:        meta.sub,
  cycle:      'creatures',
  cycleLabel: 'Creatures',
  hook:       '',
  src:        `/assets/creatures/${slug}.png`,
  src4x:      `/assets/creatures/${slug}-4x.png`,
}))

// Mythological locations (Otherworld places)
const _locationImgs = ['dun-aonghasa','emain-ablach','mag-mell','tech-duinn','tir-tairngire']
const _locationNames = {
  'dun-aonghasa': 'Dún Aonghasa', 'emain-ablach': 'Emain Ablach',
  'mag-mell': 'Mag Mell', 'tech-duinn': 'Tech Duinn', 'tir-tairngire': 'Tír Tairngire'
}
const _locations = _locationImgs.map(slug => ({
  type:       'place',
  id:         `loc-${slug}`,
  title:      _locationNames[slug] || slug,
  sub:        'Otherworld',
  cycle:      'mythological',
  cycleLabel: 'Mythological',
  hook:       '',
  src:        `/assets/locations/${slug}.png`,
  src4x:      `/assets/locations/${slug}-4x.png`,
}))

// Unified pool — stories first, then places, then locations, then creatures, then characters
const ALL_ART = [..._stories, ..._places, ..._locations, ..._creatures, ..._chars]

// ── State ─────────────────────────────────────────────────────────────────── //

let _el          = null
let _lightboxEl  = null
let _isOpen      = false
let _lightboxOpen = false
let _filter      = 'all'   // 'all' | 'mythological' | 'ulster' | 'fenian' | 'characters'
let _activePiece = null

// ── Init ─────────────────────────────────────────────────────────────────── //

export function initArtScreen() {
  _el = document.getElementById('art-screen')
  _lightboxEl = document.getElementById('art-lightbox')
  if (!_el) return

  // Rebuild tab row with type-aware filters
  _buildTabs()

  document.getElementById('art-screen-close')?.addEventListener('click', closeArtScreen)
  document.querySelector('.art-backdrop')?.addEventListener('click', closeArtScreen)
  document.getElementById('art-lightbox-close')?.addEventListener('click', _closeLightbox)
  document.querySelector('.art-lb-backdrop')?.addEventListener('click', _closeLightbox)

  document.getElementById('art-grid')?.addEventListener('click', e => {
    const card = e.target.closest('[data-art-id]')
    if (card) _openLightbox(card.dataset.artId, card.dataset.artType)
  })

  // Lightbox story button — navigate to Atlas + story mode
  document.getElementById('art-lb-story-btn')?.addEventListener('click', () => {
    if (!_activePiece) return
    _closeLightbox()
    closeArtScreen()
    if (_activePiece.type === 'story') {
      document.dispatchEvent(new CustomEvent('atlas:enterStory', {
        detail: { storyId: _activePiece.id, beatIndex: 0 }
      }))
    } else if (_activePiece.type === 'place') {
      document.dispatchEvent(new CustomEvent('search:openPlace', {
        detail: { placeId: _activePiece.id }
      }))
    } else if (_activePiece.type === 'character') {
      document.dispatchEvent(new CustomEvent('search:openChar', {
        detail: { charId: _activePiece.id }
      }))
    }
  })

  document.addEventListener('keydown', e => {
    if (_lightboxOpen) {
      if (e.key === 'Escape')     _closeLightbox()
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

// ── Public ────────────────────────────────────────────────────────────────── //

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

// ── Tabs ─────────────────────────────────────────────────────────────────── //

function _buildTabs() {
  const row = _el?.querySelector('.art-tabs')
  if (!row) return
  const tabs = [
    { key: 'all',          label: `All (${ALL_ART.length})` },
    { key: 'mythological', label: 'Mythological' },
    { key: 'ulster',       label: 'Ulster' },
    { key: 'fenian',       label: 'Fenian' },
    { key: 'creatures',    label: `Creatures (${_creatures.length})` },
    { key: 'characters',   label: `Characters (${_chars.length})` },
  ]
  row.innerHTML = tabs.map(t =>
    `<button class="art-tab${t.key === _filter ? ' is-active' : ''}" data-cycle="${t.key}">${t.label}</button>`
  ).join('')
  row.querySelectorAll('.art-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      _filter = btn.dataset.cycle
      row.querySelectorAll('.art-tab').forEach(b => b.classList.toggle('is-active', b === btn))
      _render()
    })
  })
}

// ── Render grid ─────────────────────────────────────────────────────────────//

function _filtered() {
  if (_filter === 'all')        return ALL_ART
  if (_filter === 'characters') return _chars
  if (_filter === 'creatures')  return _creatures
  return ALL_ART.filter(a => a.cycle === _filter)
}

function _render() {
  const grid = document.getElementById('art-grid')
  if (!grid) return

  const list = _filtered()
  const typeIcon = { story: '📖', character: '⚔', place: '📍', creature: '🐉' }

  grid.setAttribute('role', 'list')
  grid.innerHTML = list.map(a => `
    <button class="art-card art-card--${a.type}" data-art-id="${_esc(a.id)}" data-art-type="${a.type}"
      aria-label="${_esc(a.title)}" role="listitem">
      <div class="art-card-img-wrap">
        <img src="${_esc(a.src)}" alt="${_esc(a.title)}" class="art-card-img" loading="lazy"
          onerror="this.closest('.art-card').style.display='none'" />
        <div class="art-card-overlay">
          <span class="art-card-type-badge">${typeIcon[a.type] || ''}</span>
          <div class="art-card-cycle" style="background:${CYCLE_COLORS[a.cycle] || '#4a4030'}">${_esc(a.cycleLabel)}</div>
          <h3 class="art-card-title">${_esc(a.title)}</h3>
          <p class="art-card-sub">${_esc(a.sub)}</p>
        </div>
      </div>
    </button>
  `).join('')
}

// ── Lightbox ─────────────────────────────────────────────────────────────── //

function _openLightbox(artId, artType) {
  const piece = ALL_ART.find(a => a.id === artId && (!artType || a.type === artType))
             || ALL_ART.find(a => a.id === artId)
  if (!piece || !_lightboxEl) return
  _activePiece = piece
  _lightboxOpen = true

  const imgEl = document.getElementById('art-lb-img')
  imgEl.onerror = () => { imgEl.src = piece.src }
  imgEl.src = piece.src4x || piece.src

  const cycleEl = document.getElementById('art-lb-cycle')
  if (cycleEl) {
    cycleEl.textContent = piece.cycleLabel
    cycleEl.style.background = CYCLE_COLORS[piece.cycle] || '#4a4030'
  }
  document.getElementById('art-lb-title').textContent = piece.title
  document.getElementById('art-lb-sub').textContent   = piece.sub
  document.getElementById('art-lb-hook').textContent  = piece.hook

  // Relabel the action button per type
  const storyBtn = document.getElementById('art-lb-story-btn')
  if (storyBtn) {
    if (piece.type === 'story')     { storyBtn.textContent = 'Follow on the map →'; storyBtn.style.display = '' }
    else if (piece.type === 'place')     { storyBtn.textContent = 'View on Atlas →'; storyBtn.style.display = '' }
    else if (piece.type === 'character') { storyBtn.textContent = 'View character →'; storyBtn.style.display = '' }
    else { storyBtn.style.display = 'none' }
  }

  _lightboxEl.classList.add('is-open')
  _lightboxEl.removeAttribute('aria-hidden')
  document.body.classList.add('lightbox-active')
}

function _closeLightbox() {
  _lightboxOpen = false
  _activePiece  = null
  _lightboxEl?.classList.remove('is-open')
  _lightboxEl?.setAttribute('aria-hidden', 'true')
  document.body.classList.remove('lightbox-active')
}

function _shiftLightbox(dir) {
  if (!_activePiece) return
  const list = _filtered()
  const idx  = list.findIndex(a => a.id === _activePiece.id && a.type === _activePiece.type)
  const next = list[(idx + dir + list.length) % list.length]
  if (next) _openLightbox(next.id, next.type)
}

function _esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])
  )
}
