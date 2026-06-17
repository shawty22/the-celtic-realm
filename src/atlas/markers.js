import L from 'leaflet'

const LAYER_COLORS = {
  mythological: { fill: '#C8A84B', stroke: '#8B6914', text: '#1C1208' },
  ulster:       { fill: '#8B2020', stroke: '#5C0F0F', text: '#F5E6D3' },
  fenian:       { fill: '#2D5A3D', stroke: '#1A3D28', text: '#F5E6D3' },
}

const TYPE_GLYPH = {
  location: '◉',
  person:   '◎',
  deity:    '✦',
  group:    '❊',
  story:    '◈',
  event:    '◆',
  artifact: '◇',
  creature: '◉',
}

function markerDiameter(type) {
  if (type === 'location' || type === 'event') return 22
  if (type === 'story')                        return 20
  if (type === 'group')                        return 18
  return 18
}

function isOtherworld(entry) {
  return (
    entry.county?.includes('Mythological') ||
    entry.county?.includes('Western Sea')
  )
}

export function makeIcon(entry) {
  const col = LAYER_COLORS[entry.layer] || LAYER_COLORS.mythological
  const glyph = TYPE_GLYPH[entry.type] || '◉'
  const d = markerDiameter(entry.type)
  const r = d / 2
  const other = isOtherworld(entry)

  const fillColor   = other ? 'none'     : col.fill
  const fillOpacity = other ? 0          : 0.88
  const strokeDash  = other ? '5,3'      : 'none'
  const glyphColor  = other ? col.fill   : col.text
  const glyphSize   = Math.round(d * 0.5)

  const svg = `<div class="marker-inner"><svg viewBox="0 0 ${d} ${d}" width="${d}" height="${d}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${r}" cy="${r}" r="${r - 1.5}"
      fill="${fillColor}" fill-opacity="${fillOpacity}"
      stroke="${col.fill}" stroke-width="1.5"
      stroke-dasharray="${strokeDash}"
    />
    <text x="${r}" y="${r + glyphSize * 0.38}"
      text-anchor="middle" dominant-baseline="middle"
      font-size="${glyphSize}"
      fill="${glyphColor}"
      font-family="system-ui"
    >${glyph}</text>
  </svg></div>`

  return L.divIcon({
    html: svg,
    className: `atlas-marker layer-${entry.layer} type-${entry.type}`,
    iconSize:   [d, d],
    iconAnchor: [r, r],
    tooltipAnchor: [r + 2, -r],
  })
}

export function placeMarker(entry, layerGroup, onSelect) {
  const icon   = makeIcon(entry)
  const marker = L.marker([entry.lat, entry.lng], { icon, title: entry.name })

  marker.bindTooltip(entry.name, {
    className: 'marker-label',
    permanent: false,
    direction: 'right',
    offset: [8, 0],
  })

  marker.on('click', () => {
    document
      .querySelectorAll('.atlas-marker.is-selected')
      .forEach((el) => el.classList.remove('is-selected'))
    marker.getElement()?.classList.add('is-selected')
    onSelect(entry)
  })

  layerGroup.addLayer(marker)
  return marker
}
