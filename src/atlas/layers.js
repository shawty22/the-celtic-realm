import L from 'leaflet'
import { placeMarker, getMarker } from './markers.js'

const state = {
  mythological: { active: true, group: null },
  ulster:       { active: true, group: null },
  fenian:       { active: true, group: null },
}

export function buildLayers(map, allData, onSelect) {
  for (const [layerId, entries] of Object.entries(allData)) {
    const group = L.layerGroup()
    state[layerId] = state[layerId] || { active: false }
    state[layerId].group = group

    for (const entry of entries) {
      placeMarker(entry, group, onSelect)
    }

    if (state[layerId].active) {
      group.addTo(map)
    }
  }
}

export function toggleLayer(layerId, map) {
  const s = state[layerId]
  if (!s || !s.group) return false

  if (s.active) {
    s.group.removeFrom(map)
    s.active = false
  } else {
    s.group.addTo(map)
    s.active = true
  }
  return s.active
}

export function getLayerActive(layerId) {
  return state[layerId]?.active ?? false
}

export function highlightPlaces(placeIds, map) {
  if (!placeIds?.length) return
  const ids = new Set(placeIds)
  const found = []

  ids.forEach(id => {
    const marker = getMarker(id)
    if (!marker) return
    // Ensure the layer is visible
    const el = marker.getElement()
    if (el) {
      el.classList.remove('char-highlight-pulse')
      void el.offsetWidth // reflow to restart animation
      el.classList.add('char-highlight-pulse')
      setTimeout(() => el.classList.remove('char-highlight-pulse'), 5000)
    }
    found.push(marker)
  })

  // Fit map to show all highlighted places
  if (found.length && map) {
    if (found.length === 1) {
      map.setView(found[0].getLatLng(), Math.max(map.getZoom(), 9), { animate: true })
    } else {
      const group = L.featureGroup(found)
      map.fitBounds(group.getBounds().pad(0.3), { animate: true, maxZoom: 10 })
    }
  }
}
