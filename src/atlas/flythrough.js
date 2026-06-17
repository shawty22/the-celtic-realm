// Dramatic approach angles per notable location.
// range = metres camera-to-centre · altitude = metres above sea level
const CAMERA_HINTS = {
  // Mythological Cycle
  'tara':              { altitude: 150, range: 1200, tilt: 63, heading: 175 },
  'bru-na-boinne':     { altitude: 60,  range: 800,  tilt: 68, heading: 45  },
  'uisneach':          { altitude: 180, range: 1600, tilt: 60, heading: 220 },
  'tailteann':         { altitude: 100, range: 1000, tilt: 60, heading: 0   },
  'kildare':           { altitude: 80,  range: 1000, tilt: 58, heading: 0   },
  'tory-island':       { altitude: 200, range: 2500, tilt: 55, heading: 90  },
  'lough-derravaragh': { altitude: 150, range: 2200, tilt: 56, heading: 0   },
  'mag-tuired-south':  { altitude: 350, range: 2500, tilt: 54, heading: 0   },
  'mag-tuired-north':  { altitude: 300, range: 2000, tilt: 56, heading: 0   },
  // Ulster Cycle
  'emain-macha':       { altitude: 120, range: 1000, tilt: 65, heading: 45  },
  'rathcroghan':       { altitude: 100, range: 1500, tilt: 60, heading: 0   },
  'cooley':            { altitude: 400, range: 3000, tilt: 55, heading: 330 },
  'ath-fhirdia':       { altitude: 30,  range: 600,  tilt: 70, heading: 0   },
  'dun-dealgan':       { altitude: 80,  range: 900,  tilt: 62, heading: 180 },
  'knocknarea':        { altitude: 500, range: 2800, tilt: 50, heading: 270 },
  'slieve-gullion':    { altitude: 450, range: 2200, tilt: 55, heading: 0   },
  'cave-of-cats':      { altitude: 80,  range: 1200, tilt: 62, heading: 0   },
  // Fenian Cycle
  'hill-of-allen':     { altitude: 150, range: 1400, tilt: 60, heading: 0   },
  'ben-bulben':        { altitude: 600, range: 3000, tilt: 50, heading: 100 },
  'giants-causeway':   { altitude: 80,  range: 1200, tilt: 58, heading: 200 },
  'slieve-bloom':      { altitude: 400, range: 3500, tilt: 52, heading: 0   },
  'lough-leane':       { altitude: 500, range: 5000, tilt: 50, heading: 0   },
  'boyne-salmon':      { altitude: 60,  range: 800,  tilt: 65, heading: 90  },
}

const DEFAULT_HINT = { altitude: 180, range: 1800, tilt: 60, heading: 0 }

// Entries with no physical location — no fly button
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

// Returns true for entries that should show the "Fly to 3D" button
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
    alert('3D flythrough: open .env.local in the project root and add your Google Maps key to VITE_GOOGLE_MAPS_KEY, then restart the dev server.')
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
    alert('3D flythrough unavailable — verify the Maps key is valid and that you are using Chrome or Edge (Firefox does not support WebGL 3D tiles).')
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
  if (overlayMap) return  // reuse existing element; flyCameraTo will reposition

  overlayMap = new Map3DElement_()
  // Initial position: high above the target location for a dramatic swoop-in
  overlayMap.center  = { lat: entry.lat, lng: entry.lng, altitude: 0 }
  overlayMap.range   = 80000
  overlayMap.tilt    = 0
  overlayMap.heading = 0
  _container.appendChild(overlayMap)

  // Brief pause — lets the element register and tile requests begin
  await new Promise((r) => setTimeout(r, 700))
}

async function animateFly(entry) {
  // Reveal 3D view: spinner fades out, map fades in, camera starts moving
  _overlay.classList.remove('is-loading')

  const h = CAMERA_HINTS[entry.id] || DEFAULT_HINT

  await overlayMap.flyCameraTo({
    endCamera: {
      center:  { lat: entry.lat, lng: entry.lng, altitude: h.altitude },
      tilt:    h.tilt,
      heading: h.heading,
      range:   h.range,
    },
    durationMillis: 5000,
  })

  // Gentle 360° orbit after landing — not awaited so exit works immediately
  overlayMap.flyCameraAround({
    camera: {
      center:  { lat: entry.lat, lng: entry.lng, altitude: h.altitude },
      tilt:    h.tilt,
      range:   h.range,
    },
    durationMillis: 22000,
    rounds: 1,
  })
}
