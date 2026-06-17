import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export function initMap() {
  const map = L.map('map', {
    center: [53.45, -8.0],
    zoom: 7,
    minZoom: 5,
    maxZoom: 14,
    zoomControl: false,
    attributionControl: true,
  })

  L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, © <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }
  ).addTo(map)

  L.control.zoom({ position: 'bottomright' }).addTo(map)

  // Restrict pan to roughly the North Atlantic + Ireland + UK area
  map.setMaxBounds([
    [47.0, -18.0],
    [57.5, 0.0],
  ])

  return map
}
