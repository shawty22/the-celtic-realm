# Case Study: The Celtic Realm

**A Living Atlas of Irish Mythology** — an interactive, sourced map of Ireland's three mythology cycles, built as a personal project exploring how to make historically-grounded folklore content genuinely explorable rather than just readable.

## The challenge

Most Irish-mythology content online falls into one of two failure modes: academically dense and hard to explore casually, or casually written with no sourcing — no way for a reader to tell what's archaeologically attested versus purely legendary. Neither format lets someone browse Irish mythology the way they'd browse a map: spatially, by curiosity, dropping into whatever place or character catches their eye.

The goal was a single atlas that never sacrifices sourcing for accessibility — every entry traceable to a named primary text (Lebor Gabála Érenn, Cath Maige Tuired, the Táin Bó Cúailnge) with an explicit, honestly-assigned confidence rating — while still being something a visitor opens and just clicks around in for ten minutes.

## The approach

**Data first.** Fifty entries were researched and written before any UI existed, split across the three cycles (Mythological, Ulster, Fenian) with a strict schema: name, Irish name, coordinates, era, a short and a long summary, named sources, and a `confidence` field (`high` / `medium` / `low`) assigned honestly rather than optimistically. A 785-entry archaeology layer was added on top for real find-locations, independent of the curated narrative layer.

**Map as the organizing metaphor.** Leaflet renders the island with each cycle as an independently-toggleable colored layer (gold / crimson / forest green), plus an interpretive Táin Route tracing Queen Medb's army — always labelled "interpretive," since the Táin's actual geography is scholarly-debated.

**A second, smaller experience layered on top.** For a subset of high-value locations, clicking through to "3D" hands off from the 2D map to a separate canvas-rendered diorama — its own background/atmosphere/creature-rendering stack, with creature behaviour driven by a procedural mood system (trait weights across calm / curiosity / mischief / sociability) rather than a fixed animation loop. A `flythrough.js` module holds hand-tuned camera parameters (altitude, range, tilt, heading) per named location, so the transition into each place feels directed rather than generic.

## Architecture

Full diagram in [`assets/architecture/architecture.md`](assets/architecture/architecture.md). Static, client-only, no backend: Vite builds a single-page app where JSON datasets are the entire content layer, loaded once at boot and handed to the map (`atlas/`) and, on demand, to the canvas world (`world/`).

## Tradeoffs

- **Vanilla JS over a framework.** No React/Vue — for a map-plus-canvas app with this data shape, a framework's overhead (virtual DOM diffing against a Leaflet instance that manages its own DOM) wasn't worth it. The cost: more manual wiring between the data layer and the two render surfaces (map, canvas).
- **Two render layers instead of one.** Keeping the canvas "world" as a separate module that only initializes on demand kept the primary map fast, at the cost of a real architectural seam to maintain between `atlas/` and `world/`.
- **Depth over breadth on the cinematic camera.** Hand-tuning `flythrough.js` per location doesn't scale to hundreds of entries — a deliberate choice to make the ~30 most important locations feel authored rather than make all 50 feel generic.
- **Honesty over completeness.** Committing to a visible `confidence` rating on every entry means some entries read as admittedly speculative (`low`) rather than presenting everything with equal authority — a harder sell for casual engagement, but the one non-negotiable constraint of the project.

## Lessons learned

- Deciding the confidence-rating schema *before* writing any content made it far easier to stay honest about folklore versus attested fact — retrofitting that distinction after the fact would have meant re-litigating fifty entries.
- A previous, narrower prototype ("The Otherworld Hearth" — Chapter I, an animated creature diorama with no map) was preserved on its own branch (`archive/otherworld-hearth-prototype`, tagged `v0.1-otherworld-hearth`) rather than discarded when the project pivoted toward the map-first structure — cheap insurance that turned out to matter when reusing pieces of it for the current "3D" hand-off.
- Splitting render responsibility between the map and the canvas world early avoided a much messier refactor that would have been needed if both had shared one rendering surface from the start.

## Future work

- Public deployment (static build, ready to ship to GitHub Pages)
- Entry search and related-entry click-through
- Two more interpretive routes (Diarmuid & Gráinne's pursuit; Oisín's return from Tír na nÓg)
- A cycle-era timeline placing the three cycles relative to each other and to the historical record
- Extending the "3D" diorama treatment beyond its current pilot locations
