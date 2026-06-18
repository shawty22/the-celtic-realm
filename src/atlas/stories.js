import L from 'leaflet'
import catalog from '../data/stories-catalog.json'

let _map      = null
let _allData  = null
let _story    = null
let _beatIdx  = 0

// DOM refs — resolved once in initStories
let drawerEl, storiesListEl, stripEl
let stripStoryTitleEl, stripBeatTitleEl, stripBeatTextEl
let stripCountEl, stripPrevBtn, stripNextBtn, stripExitBtn

// Reverse index: locationId → [storyId, ...]
const locationStories = {}

export function initStories(map, allData) {
  _map     = map
  _allData = allData

  _buildLocationIndex()

  drawerEl       = document.getElementById('stories-drawer')
  storiesListEl  = document.getElementById('stories-list')
  stripEl        = document.getElementById('story-strip')
  stripStoryTitleEl = document.getElementById('strip-story-title')
  stripBeatTitleEl  = document.getElementById('strip-beat-title')
  stripBeatTextEl   = document.getElementById('strip-beat-text')
  stripCountEl      = document.getElementById('strip-beat-count')
  stripPrevBtn      = document.getElementById('strip-prev')
  stripNextBtn      = document.getElementById('strip-next')
  stripExitBtn      = document.getElementById('strip-exit')

  document.getElementById('stories-btn')?.addEventListener('click', openDrawer)
  document.getElementById('stories-drawer-close')?.addEventListener('click', closeDrawer)
  drawerEl?.querySelector('.stories-drawer-backdrop')?.addEventListener('click', closeDrawer)

  stripPrevBtn?.addEventListener('click', prevBeat)
  stripNextBtn?.addEventListener('click', nextBeat)
  stripExitBtn?.addEventListener('click', exitStory)

  // Panel can dispatch this to enter a story at a beat
  document.addEventListener('atlas:enterStory', (e) => {
    enterStory(e.detail?.storyId, e.detail?.beatIndex ?? 0)
  })

  _renderDrawer()
}

// Public API used by panel.js
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

  // Close any open atlas panels
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

  // Also pull associatedStories from the atlas data itself
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
  if (!storiesListEl) return

  storiesListEl.innerHTML = catalog.map(story => `
    <div class="story-card story-cycle-${story.cycle}">
      <div class="story-card-top">
        <span class="story-card-icon">${story.icon}</span>
        <span class="story-cycle-badge cycle-badge-${story.cycle}">${story.cycleLabel}</span>
      </div>
      <h3 class="story-card-title">${_x(story.title)}</h3>
      <p class="story-card-sub">${_x(story.titleSub)}</p>
      <p class="story-card-hook">${_x(story.hook)}</p>
      <p class="story-card-source">${_x(story.source)}</p>
      <button class="story-card-btn" data-story-id="${story.id}">
        Begin story · ${story.beats.length} parts ↗
      </button>
    </div>
  `).join('')

  storiesListEl.querySelectorAll('.story-card-btn').forEach(btn => {
    btn.addEventListener('click', () => enterStory(btn.dataset.storyId))
  })
}

function _showBeat(idx) {
  if (!_story) return
  const beats = _story.beats
  if (idx < 0 || idx >= beats.length) return

  _beatIdx = idx
  const beat = beats[idx]

  // Update strip content
  if (stripStoryTitleEl) stripStoryTitleEl.textContent = _story.title
  if (stripBeatTitleEl)  stripBeatTitleEl.textContent  = beat.title
  if (stripBeatTextEl)   stripBeatTextEl.textContent   = beat.plain
  if (stripCountEl)      stripCountEl.textContent      = `${idx + 1} of ${beats.length}`

  if (stripPrevBtn) stripPrevBtn.disabled = (idx === 0)
  if (stripNextBtn) stripNextBtn.disabled = (idx === beats.length - 1)
  if (stripNextBtn) stripNextBtn.textContent = (idx === beats.length - 1) ? 'Finish' : 'Next →'

  stripEl?.classList.add('is-active')
  stripEl?.setAttribute('data-cycle', _story.cycle)

  // Pan map to beat location
  _panToBeat(beat)

  // Pulse the referenced atlas marker
  if (beat.locationId) _pulseMarker(beat.locationId)
}

function _panToBeat(beat) {
  if (!_map) return

  let lat, lng
  if (beat.locationId) {
    const entry = _findEntry(beat.locationId)
    if (entry) { lat = entry.lat; lng = entry.lng }
  }
  if (!lat && beat.lat) { lat = beat.lat; lng = beat.lng }
  if (!lat) return

  const zoom = beat.zoom || 9
  _map.flyTo([lat, lng], zoom, { animate: true, duration: 1.4, easeLinearity: 0.4 })
}

function _findEntry(locationId) {
  const all = [
    ...(_allData?.mythological || []),
    ...(_allData?.ulster       || []),
    ...(_allData?.fenian       || []),
  ]
  return all.find(e => e.id === locationId) || null
}

function _pulseMarker(locationId) {
  // Remove any previous pulse
  document.querySelectorAll('.story-pulse').forEach(el => el.classList.remove('story-pulse'))

  // Find and pulse the Leaflet marker element for this locationId
  // We look in the DOM for the atlas marker whose title matches
  const entry = _findEntry(locationId)
  if (!entry) return

  // Atlas markers have a title attribute set to the entry name
  const allMarkerEls = document.querySelectorAll('.leaflet-marker-icon')
  for (const el of allMarkerEls) {
    if (el.title === entry.name) {
      el.classList.add('story-pulse')
      break
    }
  }
}

function prevBeat() {
  if (_beatIdx > 0) _showBeat(_beatIdx - 1)
}

function nextBeat() {
  if (!_story) return
  if (_beatIdx < _story.beats.length - 1) {
    _showBeat(_beatIdx + 1)
  } else {
    exitStory()
  }
}

function exitStory() {
  _story   = null
  _beatIdx = 0
  stripEl?.classList.remove('is-active')
  stripEl?.removeAttribute('data-cycle')
  document.querySelectorAll('.story-pulse').forEach(el => el.classList.remove('story-pulse'))
}

function openDrawer() {
  drawerEl?.classList.add('is-open')
}

function closeDrawer() {
  drawerEl?.classList.remove('is-open')
}

function _x(s) {
  return String(s ?? '').replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])
  )
}
