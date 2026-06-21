import { getStoriesForLocation } from './stories.js'
import { getCharacter }         from './characters.js'
import mythData   from '../data/mythological.json'
import ulsterData from '../data/ulster.json'
import fenianData from '../data/fenian.json'

const _allEntries = [...mythData, ...ulsterData, ...fenianData]
function _findEntry(id) { return _allEntries.find(e => e.id === id) ?? null }

const panel   = document.getElementById('detail-panel')
const content = document.getElementById('panel-content')
const closeBtn = document.getElementById('panel-close')

const CYCLE_LABELS = {
  mythological: 'Mythological Cycle',
  ulster:       'Ulster Cycle',
  fenian:       'Fenian Cycle',
}

const CONFIDENCE_TEXT = {
  high:   'Well-attested in medieval sources',
  medium: 'Traditional identification — location approximate',
  low:    'Symbolic or mythological — no physical location assigned',
}

// Entries with a real physical location are flyable
function isFlyable(e) {
  return (
    e.confidence !== 'low' &&
    !e.county?.includes('Mythological') &&
    !e.county?.includes('Western Sea')
  )
}

let _flyTo = null

export function initPanel(flyToFn) {
  _flyTo = flyToFn || null
  closeBtn.addEventListener('click', hidePanel)
  document.addEventListener('atlas:mapclick', hidePanel)
}

export function showPanel(entry) {
  content.innerHTML = buildHTML(entry)
  panel.classList.add('is-open')
  panel.setAttribute('aria-hidden', 'false')
  panel.scrollTop = 0

  if (_flyTo && isFlyable(entry)) {
    const btn = content.querySelector('.fly-3d-btn')
    if (btn) btn.addEventListener('click', () => _flyTo(entry))
  }

  content.querySelectorAll('.panel-story-link').forEach(btn => {
    btn.addEventListener('click', () => {
      hidePanel()
      document.dispatchEvent(new CustomEvent('atlas:enterStory', {
        detail: { storyId: btn.dataset.storyId, beatIndex: 0 }
      }))
    })
  })

  content.querySelectorAll('.panel-loc-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const loc = _findEntry(btn.dataset.locId)
      if (loc) showPanel(loc)
    })
  })
}

export function hidePanel() {
  panel.classList.remove('is-open')
  panel.setAttribute('aria-hidden', 'true')
  document.querySelectorAll('.atlas-marker.is-selected')
    .forEach((el) => el.classList.remove('is-selected'))
}

function buildHTML(e) {
  const cycleLabel = CYCLE_LABELS[e.layer] || e.cycle || ''
  const confText   = CONFIDENCE_TEXT[e.confidence] || ''
  const imagePath  = e.imageFile ? `/assets/${e.layer}/${e.imageFile}` : null
  const isOther    = e.county?.includes('Mythological') || e.county?.includes('Western Sea')

  const locationHTML = e.county
    ? isOther
      ? `<div class="panel-location"><span class="loc-mythological">✦ Mythological location — western sea</span></div>`
      : `<div class="panel-location"><span class="loc-pin">📍</span><span>${x(e.county)}${e.province ? `, ${x(e.province)}` : ''}</span></div>`
    : ''

  const imageHTML = imagePath
    ? `<div class="panel-image-wrap" id="img-wrap">
        <img class="panel-image" src="${imagePath}" alt="${x(e.name)}"
          onerror="document.getElementById('img-wrap').classList.add('image-missing')" />
        <div class="panel-image-placeholder">
          <div class="placeholder-border"></div>
          <span class="placeholder-label">${x(e.name)}</span>
          <span class="placeholder-sub">Artwork pending</span>
          <span class="placeholder-filename">${x(e.imageFile)}</span>
        </div>
      </div>`
    : ''

  const sourcesHTML = e.sources?.length
    ? `<div class="panel-section">
        <h3 class="panel-section-h">Primary Sources</h3>
        <ul class="panel-sources">${e.sources.map((s) => `<li>${x(s)}</li>`).join('')}</ul>
      </div>`
    : ''

  const confHTML = e.confidence
    ? `<div class="confidence-badge confidence-${x(e.confidence)}">
        <span class="conf-label">${x(e.confidence.toUpperCase())} CONFIDENCE</span>
        <span class="conf-text">${x(confText)}</span>
      </div>`
    : ''

  const notesHTML = e.notes
    ? `<p class="panel-notes">${x(e.notes)}</p>`
    : ''

  const flyBtn = (_flyTo && isFlyable(e))
    ? `<button class="fly-3d-btn" aria-label="Open 3D flythrough for ${x(e.name)}">3D ↗</button>`
    : ''

  const storyLinks    = buildStoryLinksHTML(e)
  const figuresHTML   = buildFiguresHTML(e)
  const relLocsHTML   = buildRelatedLocsHTML(e)

  return `
    <div class="panel-header layer-${x(e.layer)}">
      <div class="panel-meta">
        <span class="panel-cycle-badge">${x(cycleLabel)}</span>
        <span class="panel-type-badge">${x(e.type || '')}</span>
        ${flyBtn}
      </div>
      <h2 class="panel-title">${x(e.name)}</h2>
      ${e.nameIrish ? `<p class="panel-irish">${x(e.nameIrish)}</p>` : ''}
    </div>

    <div class="panel-body">
      ${imageHTML}
      ${locationHTML}
      <p class="panel-summary">${x(e.shortSummary)}</p>
      <p class="panel-explanation">${x(e.explanation)}</p>
      ${storyLinks}
      ${figuresHTML}
      ${relLocsHTML}
      ${sourcesHTML}
      ${confHTML}
      ${notesHTML}
    </div>
  `
}

function buildStoryLinksHTML(e) {
  let stories = []
  try { stories = getStoriesForLocation(e.id) } catch (_) {}
  if (!stories.length) return ''

  const links = stories.map(s => `
    <button class="panel-story-link cycle-badge-${x(s.cycle)}"
      data-story-id="${x(s.id)}"
      aria-label="Enter story: ${x(s.title)}">
      ${x(s.icon)} ${x(s.title)}
    </button>
  `).join('')

  return `
    <div class="panel-section panel-stories-section">
      <h3 class="panel-section-h">Appears in</h3>
      <div class="panel-story-links">${links}</div>
    </div>
  `
}

function buildFiguresHTML(e) {
  if (!e.associatedFigures?.length) return ''
  const chips = e.associatedFigures.map(id => {
    const c = getCharacter(id)
    if (!c) return ''
    return `<button class="char-chip panel-fig-chip cycle-chip-${x(c.cycle)}"
      data-char-id="${x(c.id)}" aria-label="${x(c.name)}">${x(c.name)}</button>`
  }).filter(Boolean).join('')
  if (!chips) return ''
  return `<div class="panel-section">
    <h3 class="panel-section-h">Associated figures</h3>
    <div class="panel-fig-chips">${chips}</div>
  </div>`
}

function buildRelatedLocsHTML(e) {
  if (!e.relatedLocations?.length) return ''
  const chips = e.relatedLocations.map(id => {
    const loc = _findEntry(id)
    if (!loc) return ''
    return `<button class="panel-loc-chip" data-loc-id="${x(loc.id)}">${x(loc.name)}</button>`
  }).filter(Boolean).join('')
  if (!chips) return ''
  return `<div class="panel-section">
    <h3 class="panel-section-h">Related places</h3>
    <div class="panel-loc-chips">${chips}</div>
  </div>`
}

function x(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])
  )
}
