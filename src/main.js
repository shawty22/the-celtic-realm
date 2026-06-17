import './styles/atlas.css'
import mythData from './data/mythological.json'
import ulsterData from './data/ulster.json'
import fenianData from './data/fenian.json'
import tainRouteData from './data/tain-route.json'
import archData from './data/archaeology.json'

import { initMap }              from './atlas/map.js'
import { buildLayers, toggleLayer } from './atlas/layers.js'
import { buildRoute, showRoute, hideRoute } from './atlas/route.js'
import { initPanel, showPanel } from './atlas/panel.js'
import { initFlythrough, flyTo } from './atlas/flythrough.js'
import { buildArchLayer, toggleArchLayer } from './atlas/archaeology.js'
import { initCycleModal } from './atlas/cycleinfo.js'

// ── Boot ─────────────────────────────────────────────────────────────────── //

const map = initMap()

initPanel((entry) => flyTo(entry))
initFlythrough()
initCycleModal()

const allData = {
  mythological: mythData,
  ulster:       ulsterData,
  fenian:       fenianData,
}

buildLayers(map, allData, (entry) => showPanel(entry))

const tainRoute = buildRoute(map, tainRouteData)
let tainVisible = false

// Archaeology layer
buildArchLayer(map, archData, (site, meta) => showArchPanel(site, meta))

// Close panel on bare map click
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

// Archaeology toggle
document.getElementById('arch-toggle')?.addEventListener('click', (e) => {
  const btn = e.currentTarget
  const nowActive = toggleArchLayer(map)
  btn.classList.toggle('is-active', nowActive)
  btn.setAttribute('aria-pressed', String(nowActive))
})

// ── Archaeology panel ─────────────────────────────────────────────────────── //

const archPanel = document.getElementById('arch-panel')
const archPanelContent = document.getElementById('arch-panel-content')

document.getElementById('arch-panel-close')?.addEventListener('click', closeArchPanel)
document.addEventListener('atlas:mapclick', closeArchPanel)

function showArchPanel(site, meta) {
  const wikiLink = site.wikipedia
    ? `<a class="arch-wiki-link" href="https://en.wikipedia.org/wiki/${encodeURIComponent(site.wikipedia.replace('en:',''))}" target="_blank" rel="noopener">Wikipedia ↗</a>`
    : ''

  archPanelContent.innerHTML = `
    <div class="arch-panel-header">
      <span class="arch-type-badge">${meta.label}</span>
      ${site.heritage ? '<span class="arch-heritage-badge">Protected</span>' : ''}
    </div>
    <h2 class="arch-panel-title">${esc(site.name)}</h2>
    <div class="arch-panel-coords">${site.lat.toFixed(4)}°N, ${Math.abs(site.lng).toFixed(4)}°W</div>
    ${wikiLink}
    ${site.note ? `<p class="arch-panel-note">${esc(site.note)}</p>` : ''}
    <p class="arch-panel-source">Source: OpenStreetMap contributors · National Monuments Service</p>
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

// ── Dev handle ───────────────────────────────────────────────────────────── //
if (import.meta.env?.DEV) {
  window.__atlas = { map, allData, tainRouteData, archData }
}
