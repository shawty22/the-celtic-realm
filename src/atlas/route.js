import L from 'leaflet'

let routeLayer = null

export function buildRoute(map, routeData) {
  const latlngs = routeData.waypoints.map((w) => [w.lat, w.lng])

  routeLayer = L.featureGroup()

  // Main dashed line
  L.polyline(latlngs, {
    color: '#8B2020',
    weight: 2.5,
    dashArray: '8, 5',
    opacity: 0.7,
    className: 'tain-route-line',
  }).addTo(routeLayer)

  // Labelled waypoints
  routeData.waypoints
    .filter((w) => w.label)
    .forEach((w) => {
      L.circleMarker([w.lat, w.lng], {
        radius: 5,
        color: '#8B2020',
        fillColor: '#8B2020',
        fillOpacity: 0.7,
        weight: 1.5,
        className: 'tain-waypoint',
      })
        .bindTooltip(w.name, {
          className: 'marker-label',
          permanent: false,
          direction: 'right',
          offset: [8, 0],
        })
        .addTo(routeLayer)
    })

  return routeLayer
}

export function showRoute(map, routeLayer) {
  routeLayer?.addTo(map)
}

export function hideRoute(map, routeLayer) {
  routeLayer?.removeFrom(map)
}
