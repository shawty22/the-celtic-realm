import './styles/atlas.css'
import './styles/reader.css'
import './styles/chars-screen.css'
import './styles/art-screen.css'
import './styles/learn-screen.css'
import './styles/search-palette.css'
import mythData   from './data/mythological.json'
import ulsterData from './data/ulster.json'
import fenianData from './data/fenian.json'
import tainRouteData from './data/tain-route.json'
import archData   from './data/archaeology.json'

import { initMap, setBaseLayer, flyHome, hasMaptiler } from './atlas/map.js'
import { buildLayers, toggleLayer }      from './atlas/layers.js'
import { buildRoute, showRoute, hideRoute } from './atlas/route.js'
import { initPanel, showPanel }          from './atlas/panel.js'
import { initFlythrough, flyTo }         from './atlas/flythrough.js'
import { buildArchLayer, toggleArchLayer, TYPE_META, TYPE_DESC } from './atlas/archaeology.js'
import { initCycleModal }                from './atlas/cycleinfo.js'
import { initStories }                   from './atlas/stories.js'
import { initCharacters }               from './atlas/characters.js'
import { initGallery }                  from './atlas/gallery.js'
import { initReader, openReader, closeReader, openReaderAtChapter } from './reader/reader.js'
import { initCharsScreen, openCharsScreen } from './characters/chars-screen.js'
import { initArtScreen, openArtScreen, openArtAtPiece } from './art/art-screen.js'
import { initLearnScreen, openLearnForStory } from './learn/learn-screen.js'
import { initSearch, openSearch } from './search/search-palette.js'

// ── Boot ──────────────────────────────────────────────────────────────────── //

initReader(() => {})
initGallery(() => {})
initCharsScreen()
initArtScreen()
initLearnScreen()
initSearch()

const map = initMap()

initPanel((entry) => flyTo(entry))
initFlythrough()
initCycleModal()

const allData = { mythological: mythData, ulster: ulsterData, fenian: fenianData }
const _flatEntries = [...mythData, ...ulsterData, ...fenianData]
buildLayers(map, allData, (entry) => showPanel(entry))
initStories(map, allData)
initCharacters(map, allData)

const tainRoute = buildRoute(map, tainRouteData)
let tainVisible = false

buildArchLayer(map, archData, (site, meta) => showArchPanel(site, meta))

map.on('click', () => {
  document.dispatchEvent(new Event('atlas:mapclick'))
  closeArchPanel()
})

// ── Layer toggles ─────────────────────────────────────────────────────────── //

document.querySelectorAll('.layer-toggle[data-layer]').forEach((btn) => {
  const layerId = btn.dataset.layer
  btn.addEventListener('click', () => {
    if (layerId === 'tain') {
      tainVisible = !tainVisible
      if (tainVisible) showRoute(map, tainRoute)
      else             hideRoute(map, tainRoute)
      btn.classList.toggle('is-active', tainVisible)
      btn.setAttribute('aria-pressed', String(tainVisible))
    } else {
      const nowActive = toggleLayer(layerId, map)
      btn.classList.toggle('is-active', nowActive)
      btn.setAttribute('aria-pressed', String(nowActive))
    }
  })
})

document.getElementById('arch-toggle')?.addEventListener('click', (e) => {
  const btn = e.currentTarget
  const nowActive = toggleArchLayer(map)
  btn.classList.toggle('is-active', nowActive)
  btn.setAttribute('aria-pressed', String(nowActive))
})

// ── Home button ───────────────────────────────────────────────────────────── //

document.getElementById('home-btn')?.addEventListener('click', flyHome)

// ── Read button ───────────────────────────────────────────────────────────── //

document.getElementById('read-btn')?.addEventListener('click', openReader)
document.getElementById('chars-btn')?.addEventListener('click', openCharsScreen)
document.getElementById('art-btn')?.addEventListener('click', openArtScreen)
document.getElementById('search-btn')?.addEventListener('click', () => openSearch())

// Cross-view entity links fired by Reader margin
document.addEventListener('reader:openChar', e => {
  const { charId } = e.detail
  closeReader()
  import('./atlas/characters.js').then(m => m.openCharModal(charId, null))
})

document.addEventListener('atlas:flyToLocation', e => {
  const entry = _flatEntries.find(x => x.id === e.detail.locationId)
  if (entry) showPanel(entry)
})

document.addEventListener('reader:openChapter', e => {
  openReaderAtChapter(e.detail.chapterId)
})

document.addEventListener('art:openPiece', e => {
  openArtAtPiece(e.detail.artId)
})

document.addEventListener('learn:openStory', e => {
  openLearnForStory(e.detail.storyId)
})

// Search palette routing
document.addEventListener('search:openStory', e => {
  // Open stories drawer and highlight the story
  document.getElementById('stories-btn')?.click()
  // Slight delay so drawer is open, then scroll to story card
  setTimeout(() => {
    const card = document.querySelector(`.story-card[data-story-id="${CSS.escape(e.detail.storyId)}"]`)
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    card?.classList.add('search-highlight')
    setTimeout(() => card?.classList.remove('search-highlight'), 1500)
  }, 150)
})

document.addEventListener('search:openChar', e => {
  import('./atlas/characters.js').then(m => m.openCharModal(e.detail.charId, null))
})

document.addEventListener('search:openPlace', e => {
  const entry = _flatEntries.find(x => x.id === e.detail.placeId)
  if (entry) { showPanel(entry); flyTo(entry) }
})
document.getElementById('reader-back')?.addEventListener('click', () => {
  // On mobile: show library column, hide reading pane
  document.getElementById('reader-library-col')?.classList.add('col-visible')
  document.getElementById('reader-pane')?.classList.remove('col-visible')
})

// ── Base map switcher ─────────────────────────────────────────────────────── //

// Mark OSi button as unavailable if no MapTiler API key is configured
const osiBtn = document.getElementById('bm-osi-btn')
if (osiBtn && !hasMaptiler()) {
  osiBtn.disabled = true
  osiBtn.title = 'OSi map — add VITE_MAPTILER_KEY to .env.local to enable'
  osiBtn.style.opacity = '0.35'
}

document.querySelectorAll('.bm-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.disabled) return
    document.querySelectorAll('.bm-btn').forEach(b => b.classList.remove('is-active'))
    btn.classList.add('is-active')
    setBaseLayer(btn.dataset.bm)
  })
})

// ── Archaeology panel ─────────────────────────────────────────────────────── //

const archPanel        = document.getElementById('arch-panel')
const archPanelContent = document.getElementById('arch-panel-content')

document.getElementById('arch-panel-close')?.addEventListener('click', closeArchPanel)
document.addEventListener('atlas:mapclick', closeArchPanel)

function showArchPanel(site, meta) {
  const typeDesc = TYPE_DESC[site.type] || ''
  const coords   = `${site.lat.toFixed(4)}°N, ${Math.abs(site.lng).toFixed(4)}°W`

  const wikiSection = site.wikiUrl
    ? `<a class="arch-wiki-link" href="${esc(site.wikiUrl)}" target="_blank" rel="noopener">Read on Wikipedia ↗</a>`
    : ''

  const thumbnailSection = site.thumbnail
    ? `<div class="arch-thumb-wrap">
        <img class="arch-thumb" src="${esc(site.thumbnail)}" alt="${esc(site.name)}" loading="lazy"
          onerror="this.closest('.arch-thumb-wrap').style.display='none'" />
       </div>`
    : ''

  const summarySection = site.summary
    ? `<p class="arch-summary">${esc(site.summary)}</p>`
    : ''

  archPanelContent.innerHTML = `
    <div class="arch-panel-header">
      <span class="arch-type-badge">${meta.glyph} ${esc(meta.label)}</span>
      ${site.heritage ? '<span class="arch-heritage-badge">Protected Monument</span>' : ''}
    </div>
    <h2 class="arch-panel-title">${esc(site.name)}</h2>
    <div class="arch-panel-era">${esc(meta.era)}</div>
    <div class="arch-panel-coords">${coords}</div>

    ${thumbnailSection}
    ${summarySection}
    ${wikiSection}

    <div class="arch-type-info">
      <h4 class="arch-type-info-h">About ${esc(meta.label)}s</h4>
      <p>${esc(typeDesc)}</p>
    </div>

    <p class="arch-panel-source">Source: OpenStreetMap contributors${site.wikiUrl ? ' · Wikipedia' : ''}</p>
  `
  archPanel.classList.add('is-open')
  archPanel.setAttribute('aria-hidden', 'false')
}

function closeArchPanel() {
  archPanel?.classList.remove('is-open')
  archPanel?.setAttribute('aria-hidden', 'true')
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])
  )
}

// ── Dev ───────────────────────────────────────────────────────────────────── //
if (import.meta.env?.DEV) window.__atlas = { map, allData, archData }
