// Dramatic approach angles per notable location.
// range = metres camera-to-centre · altitude = metres above sea level
const CAMERA_HINTS = {
  // Mythological Cycle
  'tara':              { altitude: 80,  range: 600,  tilt: 72, heading: 175 },
  'bru-na-boinne':     { altitude: 30,  range: 400,  tilt: 75, heading: 45  },
  'uisneach':          { altitude: 100, range: 900,  tilt: 68, heading: 220 },
  'tailteann':         { altitude: 60,  range: 700,  tilt: 68, heading: 0   },
  'kildare':           { altitude: 50,  range: 700,  tilt: 65, heading: 0   },
  'tory-island':       { altitude: 120, range: 1800, tilt: 62, heading: 90  },
  'lough-derravaragh': { altitude: 80,  range: 1400, tilt: 63, heading: 0   },
  'mag-tuired-south':  { altitude: 200, range: 1600, tilt: 60, heading: 0   },
  'mag-tuired-north':  { altitude: 180, range: 1400, tilt: 62, heading: 0   },
  // Ulster Cycle
  'emain-macha':       { altitude: 60,  range: 600,  tilt: 72, heading: 45  },
  'rathcroghan':       { altitude: 60,  range: 900,  tilt: 68, heading: 0   },
  'cooley':            { altitude: 250, range: 2000, tilt: 62, heading: 330 },
  'ath-fhirdia':       { altitude: 20,  range: 400,  tilt: 75, heading: 0   },
  'dun-dealgan':       { altitude: 50,  range: 600,  tilt: 70, heading: 180 },
  'knocknarea':        { altitude: 300, range: 1800, tilt: 58, heading: 270 },
  'slieve-gullion':    { altitude: 280, range: 1500, tilt: 62, heading: 0   },
  'cave-of-cats':      { altitude: 50,  range: 800,  tilt: 68, heading: 0   },
  // Fenian Cycle
  'hill-of-allen':     { altitude: 80,  range: 900,  tilt: 68, heading: 0   },
  'ben-bulben':        { altitude: 400, range: 2000, tilt: 57, heading: 100 },
  'giants-causeway':   { altitude: 50,  range: 800,  tilt: 65, heading: 200 },
  'slieve-bloom':      { altitude: 250, range: 2500, tilt: 60, heading: 0   },
  'lough-leane':       { altitude: 300, range: 3500, tilt: 57, heading: 0   },
  'boyne-salmon':      { altitude: 30,  range: 500,  tilt: 72, heading: 90  },
}

const DEFAULT_HINT = { altitude: 120, range: 1200, tilt: 65, heading: 0 }

const NO_FLY = new Set(['manannan', 'tir-na-nog'])

let gmLoaded = false
let Map3DElement_ = null
let overlayMap = null

let _overlay, _container, _loading, _placeName, _locLabel

export function initFlythrough() {
  _overlay   = document.getElementById('flythrough-overlay')
  _container = document.getElementById('ft3d-container')
  _loading   = document.getElementById('ft3d-loading')
  _placeName = document.getElementById('ft3d-place-name')
  _locLabel  = document.getElementById('ft3d-loc-label')

  document.getElementById('exit-3d').addEventListener('click', exitFlythrough)

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && _overlay.classList.contains('is-visible')) {
      exitFlythrough()
    }
  })
}

export function canFly(entry) {
  return (
    entry.confidence !== 'low' &&
    !NO_FLY.has(entry.id) &&
    !entry.county?.includes('Mythological') &&
    !entry.county?.includes('Western Sea')
  )
}

export async function flyTo(entry) {
  const key = import.meta.env.VITE_GOOGLE_MAPS_KEY
  if (!key) {
    alert('Add VITE_GOOGLE_MAPS_KEY to .env.local and restart the dev server.')
    return
  }

  _placeName.textContent = entry.name
  _locLabel.textContent  = entry.name
  _overlay.classList.add('is-visible', 'is-loading')
  _overlay.setAttribute('aria-hidden', 'false')

  try {
    await ensureGoogleMaps(key)
    await mountMap(entry)
    await animateFly(entry)
  } catch (err) {
    console.error('[flythrough]', err)
    exitFlythrough()
    alert('3D flythrough unavailable — verify your Maps key and use Chrome or Edge (Firefox lacks WebGL 3D tile support).')
  }
}

export function exitFlythrough() {
  _overlay.classList.remove('is-visible', 'is-loading')
  _overlay.setAttribute('aria-hidden', 'true')
}

// ── Private helpers ────────────────────────────────────────────────────────

async function ensureGoogleMaps(key) {
  if (gmLoaded && Map3DElement_) return
  await new Promise((resolve, reject) => {
    window.__gmaps3dReady = resolve
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&v=alpha&libraries=maps3d&callback=__gmaps3dReady`
    s.async = true
    s.onerror = () => reject(new Error('Google Maps script failed to load'))
    document.head.appendChild(s)
  })
  const lib = await google.maps.importLibrary('maps3d')
  Map3DElement_ = lib.Map3DElement
  gmLoaded = true
}

async function mountMap(entry) {
  if (!overlayMap) {
    overlayMap = new Map3DElement_()
    _container.appendChild(overlayMap)
  }

  // Always reset to high orbital position for a dramatic swoop-in
  overlayMap.center  = { lat: entry.lat, lng: entry.lng, altitude: 6000 }
  overlayMap.range   = 80000
  overlayMap.tilt    = 8
  overlayMap.heading = 0

  // Give tiles time to begin loading from this high view
  await new Promise((r) => setTimeout(r, 900))
}

async function animateFly(entry) {
  _overlay.classList.remove('is-loading')

  const h = CAMERA_HINTS[entry.id] || DEFAULT_HINT

  // Phase 1 — swoop in: high orbital → close ground-level view
  await overlayMap.flyCameraTo({
    endCamera: {
      center:  { lat: entry.lat, lng: entry.lng, altitude: h.altitude },
      tilt:    h.tilt,
      heading: h.heading,
      range:   h.range,
    },
    durationMillis: 7000,
  })

  // Phase 2 — slow orbit at ground level (not awaited — exit works instantly)
  overlayMap.flyCameraAround({
    camera: {
      center:  { lat: entry.lat, lng: entry.lng, altitude: h.altitude },
      tilt:    h.tilt,
      range:   h.range,
    },
    durationMillis: 60000,
    rounds: 1,
  })
}
