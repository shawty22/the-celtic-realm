import L from 'leaflet'
import catalog from '../data/stories-catalog.json'
import { flyHome } from './map.js'
import { getCharacter, renderPrimaryCharCard, renderCastChips } from './characters.js'

let _map     = null
let _allData = null
let _story   = null
let _beatIdx = 0

// Leaflet layers for story mode
let beaconMarker    = null
let tempPinMarker   = null
let connectionLine  = null

// Floating panel DOM refs
let floatEl, handleEl
let titleEl, beatTitleEl, beatTextEl, beatCountEl
let prevBtn, nextBtn, exitBtn
let storiesBtnEl

// Reverse index: locationId → [storyId, ...]
const locationStories = {}

export function initStories(map, allData) {
  _map     = map
  _allData = allData

  _buildLocationIndex()

  floatEl      = document.getElementById('story-float')
  handleEl     = document.getElementById('story-float-handle')
  titleEl      = document.getElementById('sf-story-title')
  beatTitleEl  = document.getElementById('sf-beat-title')
  beatTextEl   = document.getElementById('sf-beat-text')
  beatCountEl  = document.getElementById('sf-beat-count')
  prevBtn      = document.getElementById('sf-prev')
  nextBtn      = document.getElementById('sf-next')
  exitBtn      = document.getElementById('sf-exit')
  storiesBtnEl = document.getElementById('stories-btn')

  document.getElementById('stories-btn')?.addEventListener('click', openDrawer)
  document.getElementById('stories-drawer-close')?.addEventListener('click', closeDrawer)
  document.querySelector('.stories-drawer-backdrop')?.addEventListener('click', closeDrawer)

  prevBtn?.addEventListener('click', prevBeat)
  nextBtn?.addEventListener('click', nextBeat)
  exitBtn?.addEventListener('click', exitStory)

  document.addEventListener('atlas:enterStory', (e) => {
    enterStory(e.detail?.storyId, e.detail?.beatIndex ?? 0)
  })

  _initDrag()
  _renderDrawer()
}

export function getStoriesForLocation(locationId) {
  return (locationStories[locationId] || []).map(id => {
    const s = catalog.find(c => c.id === id)
    return s ? { id: s.id, title: s.title, cycle: s.cycle, icon: s.icon } : null
  }).filter(Boolean)
}

export function enterStory(storyId, beatIndex = 0) {
  const story = catalog.find(s => s.id === storyId)
  if (!story) return
  _story   = story
  _beatIdx = beatIndex
  closeDrawer()
  document.dispatchEvent(new Event('atlas:mapclick'))
  _showBeat(_beatIdx)
}

// ── Private ──────────────────────────────────────────────────────────────── //

function _buildLocationIndex() {
  for (const story of catalog) {
    for (const beat of story.beats) {
      if (beat.locationId) {
        if (!locationStories[beat.locationId]) locationStories[beat.locationId] = []
        if (!locationStories[beat.locationId].includes(story.id)) {
          locationStories[beat.locationId].push(story.id)
        }
      }
    }
  }
  const all = [
    ...(_allData?.mythological || []),
    ...(_allData?.ulster       || []),
    ...(_allData?.fenian       || []),
  ]
  for (const entry of all) {
    if (Array.isArray(entry.associatedStories)) {
      for (const sid of entry.associatedStories) {
        if (!locationStories[entry.id]) locationStories[entry.id] = []
        if (!locationStories[entry.id].includes(sid)) {
          locationStories[entry.id].push(sid)
        }
      }
    }
  }
}

function _renderDrawer() {
  const listEl = document.getElementById('stories-list')
  if (!listEl) return
  listEl.innerHTML = catalog.map(story => {
    const castPreview = (story.cast || []).slice(0, 4).map(entry => {
      const c = getCharacter(entry.characterId)
      return c ? `<span class="story-cast-chip cycle-chip-${_x(c.cycle)}" title="${_x(c.title)}">${_x(c.name)}</span>` : ''
    }).join('')

    const narrativeHTML = story.description
      ? `<details class="story-card-narrative">
          <summary class="story-card-narrative-toggle">Full story</summary>
          <div class="story-card-narrative-body">
            <p>${_x(story.description)}</p>
          </div>
         </details>`
      : ''

    const st = story.sourceTrail
    const sourceHTML = st
      ? `<div class="story-card-src-trail">
          <span class="story-src-conf conf-${_x(st.confidence)}">${_x(st.confidence.toUpperCase())}</span>
          <span class="story-src-primary">${_x(st.primary)}</span>
          ${st.earliest || st.oral || st.notes
            ? `<details class="story-src-detail">
                <summary>Source details</summary>
                <div class="story-src-detail-body">
                  ${st.earliest  ? `<div class="story-src-row"><span class="story-src-key">Earliest ms.</span><span>${_x(st.earliest)}</span></div>` : ''}
                  ${st.oral      ? `<div class="story-src-row"><span class="story-src-key">Oral tradition</span><span>${_x(st.oral)}</span></div>` : ''}
                  ${st.notes     ? `<div class="story-src-row story-src-notes">${_x(st.notes)}</div>` : ''}
                </div>
               </details>`
            : ''}
         </div>`
      : `<p class="story-card-source">${_x(story.source)}</p>`

    return `
    <div class="story-card story-cycle-${story.cycle}">
      <div class="story-card-top">
        <span class="story-card-icon">${story.icon}</span>
        <span class="story-cycle-badge cycle-badge-${story.cycle}">${_x(story.cycleLabel)}</span>
      </div>
      <div class="story-card-art">
        <div class="story-card-art-placeholder">
          ${story.imageFile ? `<img src="/assets/stories/${_x(story.imageFile)}" alt="${_x(story.title)}" class="story-card-art-img" loading="lazy" onerror="this.style.display='none'" />` : ''}
          <span class="story-card-art-glyph">${story.icon}</span>
          <span class="story-card-art-label">${_x(story.title)}</span>
          <span class="story-card-art-pending">Artwork pending</span>
        </div>
      </div>
      <h3 class="story-card-title">${_x(story.title)}</h3>
      <p class="story-card-sub">${_x(story.titleSub)}</p>
      <p class="story-card-hook">${_x(story.hook)}</p>
      ${narrativeHTML}
      ${castPreview ? `<div class="story-card-cast">${castPreview}</div>` : ''}
      ${sourceHTML}
      <button class="story-card-btn" data-story-id="${story.id}">
        Begin story · ${story.beats.length} parts ↗
      </button>
    </div>
    `
  }).join('')
  listEl.querySelectorAll('.story-card-btn').forEach(btn => {
    btn.addEventListener('click', () => enterStory(btn.dataset.storyId))
  })
}

function _showBeat(idx) {
  if (!_story) return
  const beats = _story.beats
  if (idx < 0 || idx >= beats.length) return
  _beatIdx = idx
  const beat = beats[idx]

  // Resolve characters
  const primaryChar = beat.primaryCharacter ? getCharacter(beat.primaryCharacter) : null
  const castChipIds = beat.castChips || []

  // Update floating panel
  if (titleEl)     titleEl.textContent     = _story.title
  if (beatTitleEl) beatTitleEl.textContent = beat.title
  if (beatTextEl)  beatTextEl.innerHTML    = _x(beat.plain)
  if (beatCountEl) beatCountEl.textContent = `${idx + 1} / ${beats.length}`

  // Inject character section into beat body
  const charSectionEl = floatEl?.querySelector('.sf-char-section')
  if (charSectionEl) {
    const primaryHTML = renderPrimaryCharCard(primaryChar, _story.id)
    const chipsHTML   = renderCastChips(castChipIds, _story.id)
    charSectionEl.innerHTML = (primaryHTML || chipsHTML)
      ? `${primaryHTML}<div class="sf-cast-row">${chipsHTML ? '<span class="sf-cast-label">Also present</span>' + chipsHTML : ''}</div>`
      : ''
  }

  if (prevBtn) prevBtn.disabled = (idx === 0)
  if (nextBtn) {
    nextBtn.disabled    = false
    nextBtn.textContent = (idx === beats.length - 1) ? 'Finish ✓' : 'Next →'
  }

  floatEl?.classList.add('is-active')
  floatEl?.setAttribute('data-cycle', _story.cycle)
  storiesBtnEl?.classList.add('story-mode-active')

  // Resolve coordinates for this beat
  const entry = beat.locationId ? _findEntry(beat.locationId) : null
  const lat   = entry?.lat ?? beat.lat
  const lng   = entry?.lng ?? beat.lng
  if (!lat || !lng) return

  // Pan map
  _map?.flyTo([lat, lng], beat.zoom ?? 9, { animate: true, duration: 1.4, easeLinearity: 0.4 })

  // Clear old story layers
  _clearStoryLayers()

  // Place beacon glow at this beat
  _placeBeacon(lat, lng, _story.cycle)

  // Place a labeled pin for beats with no existing atlas marker
  if (!beat.locationId && beat.placeName) {
    _placeTempPin(lat, lng, beat.placeName)
  }

  // Draw dashed line to the NEXT beat location
  if (idx < beats.length - 1) {
    const nb     = beats[idx + 1]
    const ne     = nb.locationId ? _findEntry(nb.locationId) : null
    const nLat   = ne?.lat ?? nb.lat
    const nLng   = ne?.lng ?? nb.lng
    if (nLat && nLng) _drawLine(lat, lng, nLat, nLng, _story.cycle)
  }
}

function _placeBeacon(lat, lng, cycle) {
  const icon = L.divIcon({
    html: `<div class="story-beacon cycle-beacon-${cycle}">
             <div class="story-beacon-ring r1"></div>
             <div class="story-beacon-ring r2"></div>
             <div class="story-beacon-core">🔥</div>
           </div>`,
    className: '',
    iconSize:   [64, 64],
    iconAnchor: [32, 32],
  })
  beaconMarker = L.marker([lat, lng], { icon, interactive: false, zIndexOffset: 1000 })
  if (_map) beaconMarker.addTo(_map)
}

function _placeTempPin(lat, lng, label) {
  const icon = L.divIcon({
    html: `<div class="story-temp-pin">
             <div class="story-temp-dot"></div>
             <span class="story-temp-label">${_x(label)}</span>
           </div>`,
    className: '',
    iconSize:   [0, 0],
    iconAnchor: [4, 8],
  })
  tempPinMarker = L.marker([lat, lng], { icon, interactive: false, zIndexOffset: 999 })
  if (_map) tempPinMarker.addTo(_map)
}

function _drawLine(lat1, lng1, lat2, lng2, cycle) {
  const colors = { mythological: '#C8A84B', ulster: '#8B2020', fenian: '#3a8c5a' }
  connectionLine = L.polyline([[lat1, lng1], [lat2, lng2]], {
    color:       colors[cycle] ?? '#C8A84B',
    weight:      2,
    opacity:     0.5,
    dashArray:   '8, 7',
    interactive: false,
  })
  if (_map) connectionLine.addTo(_map)
}

function _clearStoryLayers() {
  beaconMarker?.remove();   beaconMarker   = null
  tempPinMarker?.remove();  tempPinMarker  = null
  connectionLine?.remove(); connectionLine = null
  document.querySelectorAll('.story-pulse').forEach(el => el.classList.remove('story-pulse'))
}

function _findEntry(locationId) {
  const all = [
    ...(_allData?.mythological || []),
    ...(_allData?.ulster       || []),
    ...(_allData?.fenian       || []),
  ]
  return all.find(e => e.id === locationId) ?? null
}

function _initDrag() {
  if (!floatEl || !handleEl) return
  let dragging = false, ox = 0, oy = 0

  const startDrag = (cx, cy) => {
    dragging = true
    const r = floatEl.getBoundingClientRect()
    ox = cx - r.left
    oy = cy - r.top
    // Unpin from right/bottom anchoring
    floatEl.style.right  = 'auto'
    floatEl.style.bottom = 'auto'
  }

  handleEl.addEventListener('mousedown', e => { startDrag(e.clientX, e.clientY); e.preventDefault() })
  handleEl.addEventListener('touchstart', e => {
    const t = e.touches[0]
    startDrag(t.clientX, t.clientY)
  }, { passive: true })

  const onMove = (cx, cy) => {
    if (!dragging) return
    const maxX = window.innerWidth  - floatEl.offsetWidth  - 4
    const maxY = window.innerHeight - floatEl.offsetHeight - 4
    floatEl.style.left = Math.max(4, Math.min(maxX, cx - ox)) + 'px'
    floatEl.style.top  = Math.max(4, Math.min(maxY, cy - oy)) + 'px'
  }

  document.addEventListener('mousemove', e => onMove(e.clientX, e.clientY))
  document.addEventListener('touchmove', e => {
    const t = e.touches[0]
    onMove(t.clientX, t.clientY)
  }, { passive: true })

  const stopDrag = () => { dragging = false }
  document.addEventListener('mouseup',  stopDrag)
  document.addEventListener('touchend', stopDrag)
}

function prevBeat() { if (_beatIdx > 0) _showBeat(_beatIdx - 1) }

function nextBeat() {
  if (!_story) return
  if (_beatIdx < _story.beats.length - 1) _showBeat(_beatIdx + 1)
  else exitStory()
}

function exitStory() {
  _story   = null
  _beatIdx = 0
  floatEl?.classList.remove('is-active')
  floatEl?.removeAttribute('data-cycle')
  storiesBtnEl?.classList.remove('story-mode-active')
  _clearStoryLayers()
  flyHome()
}

function openDrawer()  { document.getElementById('stories-drawer')?.classList.add('is-open') }
function closeDrawer() { document.getElementById('stories-drawer')?.classList.remove('is-open') }

function _x(s) {
  return String(s ?? '').replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])
  )
}
