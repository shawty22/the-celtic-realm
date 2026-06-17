import './styles/atlas.css'
import mythData from './data/mythological.json'
import ulsterData from './data/ulster.json'
import fenianData from './data/fenian.json'
import tainRouteData from './data/tain-route.json'

import { initMap }              from './atlas/map.js'
import { buildLayers, toggleLayer } from './atlas/layers.js'
import { buildRoute, showRoute, hideRoute } from './atlas/route.js'
import { initPanel, showPanel, hidePanel } from './atlas/panel.js'
import { initFlythrough, flyTo }           from './atlas/flythrough.js'

// ── Boot ─────────────────────────────────────────────────────────────────── //

const map = initMap()

initPanel((entry) => flyTo(entry))
initFlythrough()

const allData = {
  mythological: mythData,
  ulster:       ulsterData,
  fenian:       fenianData,
}

buildLayers(map, allData, (entry) => showPanel(entry))

const tainRoute = buildRoute(map, tainRouteData)
let tainVisible = false

// Close panel on bare map click
map.on('click', () => {
  document.dispatchEvent(new Event('atlas:mapclick'))
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

// ── Dev handle ───────────────────────────────────────────────────────────── //
if (import.meta.env?.DEV) {
  window.__atlas = { map, allData, tainRouteData }
}
