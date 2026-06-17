import L from 'leaflet'

const ARCH_COLOR = '#A0522D'   // sienna — earth/terracotta
const ARCH_STROKE = '#6B3317'
const ARCH_DIM = 14

// Glyph and label per site type
const TYPE_META = {
  stone_circle:   { glyph: '○', label: 'Stone Circle' },
  dolmen:         { glyph: '△', label: 'Dolmen / Tomb' },
  passage_tomb:   { glyph: '△', label: 'Passage Tomb' },
  megalith:       { glyph: '△', label: 'Megalith' },
  ringfort:       { glyph: '⬡', label: 'Ring Fort' },
  hillfort:       { glyph: '⬡', label: 'Hill Fort' },
  fort:           { glyph: '⬡', label: 'Fort' },
  standing_stone: { glyph: '|', label: 'Standing Stone' },
  tumulus:        { glyph: '◬', label: 'Burial Mound' },
  cairn:          { glyph: '◬', label: 'Cairn' },
  crannog:        { glyph: '◎', label: 'Crannog' },
  battlefield:    { glyph: '✕', label: 'Battlefield' },
  site:           { glyph: '·', label: 'Archaeological Site' },
}

const r = ARCH_DIM / 2

function makeArchIcon(site) {
  const meta = TYPE_META[site.type] || TYPE_META.site
  const glyph = meta.glyph
  const d = ARCH_DIM
  const fontSize = Math.round(d * 0.48)

  const svg = `<div class="marker-inner arch-inner"><svg viewBox="0 0 ${d} ${d}" width="${d}" height="${d}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${r}" cy="${r}" r="${r - 1}"
      fill="${ARCH_COLOR}" fill-opacity="0.75"
      stroke="${ARCH_STROKE}" stroke-width="1.2"
    />
    <text x="${r}" y="${r + fontSize * 0.38}"
      text-anchor="middle" dominant-baseline="middle"
      font-size="${fontSize}" fill="#F5E6D3" font-family="system-ui"
    >${glyph}</text>
  </svg></div>`

  return L.divIcon({
    html: svg,
    className: `atlas-marker arch-marker arch-${site.type}`,
    iconSize:   [d, d],
    iconAnchor: [r, r],
    tooltipAnchor: [r + 2, -r],
  })
}

let archGroup = null
let archActive = false

export function buildArchLayer(map, data, onSelect) {
  archGroup = L.layerGroup()

  for (const site of data) {
    const icon = makeArchIcon(site)
    const marker = L.marker([site.lat, site.lng], { icon, title: site.name })
    const meta = TYPE_META[site.type] || TYPE_META.site

    marker.bindTooltip(`${site.name} <span class="tt-type">${meta.label}</span>`, {
      className: 'marker-label arch-label',
      permanent: false,
      direction: 'right',
      offset: [8, 0],
    })

    marker.on('click', () => {
      document.querySelectorAll('.atlas-marker.is-selected')
        .forEach(el => el.classList.remove('is-selected'))
      marker.getElement()?.classList.add('is-selected')
      onSelect(site, meta)
    })

    archGroup.addLayer(marker)
  }

  // Off by default — user toggles on
  archActive = false
  return archGroup
}

export function toggleArchLayer(map) {
  if (!archGroup) return false
  if (archActive) {
    archGroup.removeFrom(map)
    archActive = false
  } else {
    archGroup.addTo(map)
    archActive = true
  }
  return archActive
}

export function getArchActive() { return archActive }
