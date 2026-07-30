# Architecture

```mermaid
flowchart TB
  subgraph Data["Data layer — src/data/*.json"]
    D1["mythological.json (18)"]
    D2["ulster.json (17)"]
    D3["fenian.json (15)"]
    D4["archaeology.json (785)"]
    D5["characters.json (78)"]
    D6["stories-catalog.json (101)"]
    D7["tain-route.json"]
  end

  Vite["Vite build"] --> Boot
  Data --> Boot["main.js — boot orchestrator"]

  subgraph Atlas["atlas/ — Leaflet map layer"]
    A1["map.js"]
    A2["markers.js + layers.js"]
    A3["panel.js — entry detail panel"]
    A4["flythrough.js — cinematic per-location camera"]
    A5["cycleinfo.js / stories.js / characters.js"]
    A6["gallery.js — hero carousel"]
  end

  subgraph World["world/ — canvas diorama (3D mode)"]
    W1["world.js — realm orchestrator"]
    W2["scene.js"]
    W3["creature.js — procedural mood/behaviour"]
    W4["background.js + gl/atmosphere.js"]
  end

  Boot --> Atlas
  Atlas -- "3D ↗ on a location" --> World
```

**How it fits together:** three hand-researched JSON datasets (mythological / Ulster / Fenian cycles, 50 entries total) plus a much larger supporting archaeology layer (785 sites) are loaded once at boot and handed to a Leaflet-based map layer. Selecting an entry opens a detail panel; the "3D" affordance on a location hands off to a separate canvas-based "world" renderer that stages a small animated diorama — background, atmosphere, and creatures with a procedural mood system (calm / curiosity / mischief / sociability) rather than fixed animations. A `flythrough.js` module holds hand-tuned cinematic camera parameters (altitude, range, tilt, heading) per named location, so each "fly to" transition is directed rather than a generic zoom.

No backend — the entire app is static, client-rendered, and data-driven from committed JSON.
