import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// OSi (Ordnance Survey Ireland) tiles via MapTiler.
// Get a free API key at https://cloud.maptiler.com/account/ then add to .env.local:
//   VITE_MAPTILER_KEY=your_key_here
// Without the key, the OSi button falls back to terrain.
const MAPTILER_KEY = import.meta.env?.VITE_MAPTILER_KEY || null

const TILE_LAYERS = {
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    opts: {
      attribution: 'Map data: © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | © <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
      subdomains: 'abc',
      maxZoom: 17,
    }
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    opts: {
      attribution: 'Tiles © Esri — Source: Esri, USGS, NOAA',
      maxZoom: 18,
    }
  },
  classic: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    opts: {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }
  },
  // OSi outdoor map — Irish place names, heritage monument markers, detailed terrain.
  // Falls back to terrain if no MapTiler key set.
  osi: MAPTILER_KEY ? {
    url: `https://api.maptiler.com/maps/outdoor-v2/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`,
    opts: {
      attribution: '© <a href="https://www.maptiler.com/copyright/">MapTiler</a> · © <a href="https://www.osi.ie/">Ordnance Survey Ireland</a>',
      tileSize: 512,
      zoomOffset: -1,
      maxZoom: 21,
    }
  } : null,
}

let _map = null
let _currentTile = null

export function initMap() {
  _map = L.map('map', {
    center: [53.3, -8.0],
    zoom: 7,
    minZoom: 6,
    maxZoom: 17,
    zoomControl: false,
    attributionControl: true,
  })

  _currentTile = L.tileLayer(TILE_LAYERS.terrain.url, TILE_LAYERS.terrain.opts).addTo(_map)

  L.control.zoom({ position: 'bottomright' }).addTo(_map)

  // Constrain to Ireland
  _map.setMaxBounds([[51.0, -11.2], [55.8, -4.8]])

  return _map
}

export function flyHome() {
  if (_map) _map.setView([53.3, -8.0], 7, { animate: true, duration: 0.8 })
}

export function setBaseLayer(name) {
  const layer = TILE_LAYERS[name]
  if (!_map || !layer) return
  if (_currentTile) _map.removeLayer(_currentTile)
  _currentTile = L.tileLayer(layer.url, layer.opts).addTo(_map)
  const mapEl = document.getElementById('map')
  if (mapEl) mapEl.dataset.baselayer = name
}

export function hasMaptiler() { return Boolean(MAPTILER_KEY) }
