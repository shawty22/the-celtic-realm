import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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
  }
}

let _map = null
let _currentTile = null

export function initMap() {
  _map = L.map('map', {
    center: [53.45, -8.0],
    zoom: 7,
    minZoom: 5,
    maxZoom: 17,
    zoomControl: false,
    attributionControl: true,
  })

  _currentTile = L.tileLayer(TILE_LAYERS.terrain.url, TILE_LAYERS.terrain.opts).addTo(_map)

  L.control.zoom({ position: 'bottomright' }).addTo(_map)

  _map.setMaxBounds([[47.0, -18.0], [57.5, 0.0]])

  return _map
}

export function setBaseLayer(name) {
  if (!_map || !TILE_LAYERS[name]) return
  if (_currentTile) _map.removeLayer(_currentTile)
  _currentTile = L.tileLayer(TILE_LAYERS[name].url, TILE_LAYERS[name].opts).addTo(_map)
  // Satellite needs no muting filter; terrain/classic use the CSS filter
  const mapEl = document.getElementById('map')
  if (mapEl) {
    mapEl.dataset.baselayer = name
  }
}
