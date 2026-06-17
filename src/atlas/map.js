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
    'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    {
      attribution:
        'Map data: © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Style: © <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
      subdomains: 'abc',
      maxZoom: 17,
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
