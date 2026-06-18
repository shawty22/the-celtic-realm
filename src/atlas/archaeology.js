import L from 'leaflet'

const ARCH_COLOR  = '#9B6B3A'
const ARCH_STROKE = '#6B3F1A'
const ARCH_DIM    = 13

const TYPE_META = {
  stone_circle:   { glyph: '○', label: 'Stone Circle',     era: 'Bronze Age (c. 2500–500 BC)' },
  dolmen:         { glyph: '△', label: 'Dolmen',           era: 'Neolithic (c. 4000–2500 BC)' },
  passage_tomb:   { glyph: '△', label: 'Passage Tomb',     era: 'Neolithic (c. 3500–2500 BC)' },
  megalith:       { glyph: '△', label: 'Megalith',         era: 'Neolithic / Bronze Age' },
  ringfort:       { glyph: '⬡', label: 'Ring Fort',        era: 'Iron Age – Early Medieval (c. 500 BC–1000 AD)' },
  hillfort:       { glyph: '⬡', label: 'Hill Fort',        era: 'Iron Age (c. 600 BC–400 AD)' },
  fort:           { glyph: '⬡', label: 'Fort',             era: 'Iron Age – Medieval' },
  standing_stone: { glyph: '|', label: 'Standing Stone',   era: 'Neolithic / Bronze Age' },
  tumulus:        { glyph: '◬', label: 'Burial Mound',     era: 'Bronze Age' },
  cairn:          { glyph: '◬', label: 'Cairn',            era: 'Neolithic / Bronze Age' },
  crannog:        { glyph: '◎', label: 'Crannog',          era: 'Iron Age – Medieval' },
  battlefield:    { glyph: '✕', label: 'Battlefield',      era: 'Historic' },
  site:           { glyph: '·', label: 'Archaeological Site', era: 'Prehistoric / Historic' },
}

const TYPE_DESC = {
  stone_circle:
    'A ring of upright stones, typically erected during the Bronze Age for ritual, seasonal ceremony, or astronomical alignment. Ireland has over 100 confirmed stone circles, concentrated in Cork, Kerry, and Ulster.',
  dolmen:
    'A megalithic portal tomb consisting of upright orthostats supporting a large horizontal capstone, dating to the Neolithic. Used for communal burial across multiple generations. Ireland has around 180 confirmed dolmens.',
  passage_tomb:
    'A stone-built chambered tomb reached via a long stone-lined passage, usually covered by a circular mound (cairn). The finest examples — Newgrange, Knowth, Dowth — predate the Egyptian pyramids by 500 years.',
  megalith:
    'A large stone monument of the Neolithic or Bronze Age, encompassing dolmens, portal tombs, wedge tombs, and court tombs. Megaliths served as burial chambers, territorial markers, and ritual sites.',
  ringfort:
    'A circular earthwork enclosure, the most common archaeological monument in Ireland with over 40,000 recorded. Primarily Iron Age to early medieval farmsteads (not primarily defensive). Known as rath, lios, dún, or cashel depending on construction.',
  hillfort:
    'A large enclosure on a hilltop defined by one or more ramparts. Iron Age hillforts served as tribal centres, seasonal gathering places, and occasionally refuges. Emain Macha (Navan Fort) is the best-known.',
  fort:
    'A defensive or settlement enclosure. Includes promontory forts (cliffs as natural defence), stone cashels, and earthen raths from the Iron Age and early medieval period.',
  standing_stone:
    'A single upright stone set into the ground, ranging from Neolithic to Bronze Age. Functions include territorial markers, memorials to the dead, astronomical alignment, and meeting points. Many have ogham inscriptions added later.',
  tumulus:
    'An earthen burial mound covering a burial chamber or cist. Bronze Age tumuli are found throughout Ireland, often on prominent landscape positions. Smaller than passage tombs but widespread.',
  cairn:
    'A mound of stones, typically covering a burial chamber (cairn cemetery) or as a summit marker. Found on many Irish hills and mountains. Carrowkeel, Co. Sligo, has Ireland\'s finest cairn cemetery.',
  crannog:
    'An artificial island constructed in a lake or river, from timber, peat, brushwood and stones. Used as lake dwellings from the Bronze Age through to the medieval period for security and fishing access. Ireland has over 1,200 crannogs.',
  battlefield:
    'Site of a historically recorded engagement. Ireland\'s battlefield record spans from prehistoric tribal warfare through Viking-era clashes, Norman conquests, and the Wars of the Three Kingdoms.',
  site:
    'A confirmed archaeological site whose specific monument type is recorded in the National Monuments database. Many are cropmarks, earthworks, or upstanding remains awaiting detailed classification.',
}

const r = ARCH_DIM / 2

function makeArchIcon(site) {
  const meta = TYPE_META[site.type] || TYPE_META.site
  const d = ARCH_DIM
  const fs = Math.round(d * 0.46)

  const svg = `<div class="marker-inner arch-inner"><svg viewBox="0 0 ${d} ${d}" width="${d}" height="${d}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${r}" cy="${r}" r="${r - 1}"
      fill="${ARCH_COLOR}" fill-opacity="0.78"
      stroke="${ARCH_STROKE}" stroke-width="1.1"
    />
    <text x="${r}" y="${r + fs * 0.38}"
      text-anchor="middle" dominant-baseline="middle"
      font-size="${fs}" fill="#F5E6D3" font-family="system-ui"
    >${meta.glyph}</text>
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
    const icon   = makeArchIcon(site)
    const marker = L.marker([site.lat, site.lng], { icon, title: site.name })
    const meta   = TYPE_META[site.type] || TYPE_META.site

    marker.bindTooltip(`${site.name} <span class="tt-type">${meta.label}</span>`, {
      className:  'marker-label arch-label',
      permanent:  false,
      direction:  'right',
      offset:     [8, 0],
    })

    marker.on('click', () => {
      document.querySelectorAll('.atlas-marker.is-selected')
        .forEach(el => el.classList.remove('is-selected'))
      marker.getElement()?.classList.add('is-selected')
      onSelect(site, meta)
    })

    archGroup.addLayer(marker)
  }
  archActive = false
  return archGroup
}

export function toggleArchLayer(map) {
  if (!archGroup) return false
  if (archActive) { archGroup.removeFrom(map); archActive = false }
  else            { archGroup.addTo(map);      archActive = true  }
  return archActive
}

export function getArchActive() { return archActive }
export { TYPE_META, TYPE_DESC }
