# Living Atlas of Ireland — Project State Summary

---

## Project

Vite + Leaflet web app. Local dev at `localhost:3012`. Repo: `shawty22/the-celtic-realm` (private GitHub). Branch: `main`.
Root: `/Users/dooj/WhiteMirror/10_PROJECTS/The Celtic Realm/`

---

## What is built

A narrative-driven interactive atlas of Ireland. The map is the chassis. Layers are content. The same location can appear in multiple layers simultaneously.

### Map
- Leaflet map constrained to Ireland bounds
- Three base layers: OpenTopoMap (terrain, default), ESRI satellite, CartoDB classic
- Muted CSS filter on terrain/classic; satellite unfiltered
- Home button resets to full Ireland view (zoom 7, centre 53.3, -8.0)
- Zoom controls bottom-right

### Mythology layers (three cycles)
- Mythological Cycle — gold markers
- Ulster Cycle — crimson markers
- Fenian Cycle — green markers
- Each cycle independently toggleable via header buttons with ℹ info modals
- ~50 named locations/persons/events across all three cycles
- Data in: `src/data/mythological.json`, `ulster.json`, `fenian.json`
- Clicking any marker opens a detail panel (right side) with: cycle badge, title, Irish name, location, summary, full explanation, primary sources, confidence rating, and "Appears in" story links

### Táin route overlay
- Interpretive route across Ulster and Connacht
- Toggle in header, dashed red line on map
- Data in: `src/data/tain-route.json`

### Archaeology layer
- 785 confirmed Irish archaeological sites from OSM Overpass API
- 13 site types: stone circles, dolmens, passage tombs, ring forts, hillforts, standing stones, burial mounds, cairns, crannogs, battlefields, etc.
- Each site type has glyph, label, era, and a verified description
- Clicking a site opens a side panel with type info, coordinates, Wikipedia summary/thumbnail where available, source attribution
- 21 sites enriched with Wikipedia data
- Data in: `src/data/archaeology.json`
- Toggle in header ("Archaeology · 785 confirmed sites")

### 3D Flythrough
- Google Maps 3D API (Map3DElement, alpha)
- Triggered from any location detail panel via "3D ↗" button
- Camera swoops in from high orbit (alt 6000m, range 80000m), flies to location (7 second duration), then orbits for 60 seconds
- Exit button returns to 2D map
- API key in `.env.local`

### Story Mode

Six primary Irish stories, each with 4–6 narrative beats:

| # | Story | Cycle | Beats |
|---|---|---|---|
| 1 | Táin Bó Cúailnge | Ulster | 6 — Rathcroghan → Cooley → Emain Macha |
| 2 | Children of Lir | Mythological | 6 — Sídhe Fionnachaidh → Lough Derravaragh → Sea of Moyle → Inishglora |
| 3 | Deirdre of the Sorrows | Ulster | 6 — Emain Macha → Ulster Glens → Scotland → Emain Macha |
| 4 | Pursuit of Diarmuid and Gráinne | Fenian | 5 — Tara → all of Ireland → Ben Bulben |
| 5 | Oisín in Tír na nÓg | Fenian | 5 — Sligo coast → Atlantic → return |
| 6 | Salmon of Knowledge | Fenian | 5 — Well of Segais → River Boyne → Hill of Allen |

Story mode features:
- Stories drawer (slide-in right panel) with all 6 story cards, cycle-coloured
- Floating draggable panel (320px, defaults top-left, mouse + touch drag)
- 🔥 Animated fire beacon at each beat's map location (two radiating rings)
- Named temp location pins for story-only places (Sea of Moyle, Sídhe Fionnachaidh, Inishglora, Tír na nÓg, Well of Segais, etc.)
- Dashed connection line from current beat to next beat location
- Stories button in header pulses gold when story mode is active
- "Appears in" story links at bottom of location detail panels — clicking enters story at that beat
- Exit story → auto flies home

---

## Data files

```
src/data/
  mythological.json     — ~15 entries
  ulster.json           — ~15 entries
  fenian.json           — ~15 entries
  tain-route.json       — route waypoints
  archaeology.json      — 785 OSM sites
  stories-catalog.json  — 6 stories with all beats inline
  story-beats.json      — original Táin prelude (legacy, kept)
  characters.json       — character data for story mode
  artifacts.json        — artifact data
  locations.json        — supplementary locations
  creatures.json        — creature data
  glossary.json         — Irish terms
  realms.json           — otherworld realms
  memories.json         — (placeholder)
```

---

## Key modules

```
src/atlas/
  map.js          — initMap, flyHome, setBaseLayer
  layers.js       — buildLayers, toggleLayer
  markers.js      — placeMarker, SVG divIcon
  panel.js        — initPanel, showPanel, hidePanel
  flythrough.js   — initFlythrough, flyTo (Google Maps 3D)
  archaeology.js  — buildArchLayer, toggleArchLayer, TYPE_META, TYPE_DESC
  cycleinfo.js    — initCycleModal, CYCLES descriptions
  route.js        — buildRoute, showRoute, hideRoute
  stories.js      — initStories, enterStory, getStoriesForLocation
```

---

## What is NOT yet built

- Character cards / character journey mode (P1 — data exists in `characters.json`)
- Keyboard navigation in story mode (←→ arrows)
- Beat progress dots on the floating panel
- Official NMS SMR archaeology data (requires archaeology.ie registration)
- Dúchas.ie folklore enrichment
- Mobile layout refinements
- Artwork (image slots exist in panels, `imageFile` field in data, placeholder shown if missing)

---

## Tech stack

Vite 5, Leaflet, vanilla JS (ESM), OpenTopoMap tiles, ESRI satellite tiles, CartoDB Voyager tiles, OSM Overpass API, Google Maps 3D API (alpha), Wikipedia REST API, Playwright (headless QA)
