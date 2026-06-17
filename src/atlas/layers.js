import L from 'leaflet'
import { placeMarker } from './markers.js'

const state = {
  mythological: { active: true,  group: null },
  ulster:       { active: false, group: null },
  fenian:       { active: false, group: null },
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
