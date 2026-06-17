# Living Atlas of Irish Mythology

An interactive browser-based atlas of Ireland's three great mythology cycles — places, people, stories, and creatures, mapped across the real island with sourced, researched markers.

---

## Running

```bash
npm install
npm run dev
```

Opens on **localhost:3010** (configured in `.claude/launch.json`).

---

## What's in it

**50 researched entries** across three layers:

| Layer | Colour | Entries |
|---|---|---|
| Mythological Cycle (The God-Age) | Gold | 18 — Tuatha Dé Danann, Fomorians, Tara, Newgrange, Lugh, Brigid, the Morrígan… |
| Ulster Cycle (Age of Heroes) | Crimson | 17 — Emain Macha, Cú Chulainn, Queen Medb, the Táin, Rathcroghan, the Ford of Ferdia… |
| Fenian Cycle (The Fianna) | Forest green | 15 — Hill of Allen, Ben Bulben, Fionn, Oisín, Diarmuid, the Pursuit, Battle of Gabhra… |

Plus a **Táin Route** toggle — an interpretive dotted line tracing Medb's army from Rathcroghan east to Cooley.

---

## Data structure

Each entry lives in `src/data/{mythological,ulster,fenian}.json`:

```jsonc
{
  "id": "tara",               // kebab-case unique ID
  "name": "Hill of Tara",
  "nameIrish": "Teamhair na Rí",
  "layer": "mythological",    // "mythological" | "ulster" | "fenian"
  "cycle": "Mythological Cycle",
  "type": "location",         // location | person | deity | group | story | event | artifact | creature
  "lat": 53.5794,
  "lng": -6.6148,
  "county": "Meath",
  "province": "Leinster",
  "era": "Mythological / Iron Age",
  "shortSummary": "...",      // 1–2 sentences (shown prominently)
  "explanation": "...",       // 3–5 sentences (full detail)
  "associatedFigures": [],    // IDs of related entries
  "relatedLocations": [],
  "imageFile": "tara.webp",   // filename only — see artwork section
  "sources": ["Lebor Gabála Érenn", "Cath Maige Tuired"],
  "confidence": "high",       // "high" | "medium" | "low"
  "notes": "..."              // caveats / uncertainty
}
```

### Adding a new entry

1. Add the JSON object to the right cycle file in `src/data/`.
2. Give it a unique `id` in kebab-case.
3. Set `confidence` honestly — see the scale below.
4. Drop artwork in `public/assets/{layer}/` matching the `imageFile` field.
5. Reload — the map picks it up automatically.

### Adding a new cycle layer

1. Create `src/data/yourcycle.json`.
2. Import and add it to `allData` in `src/main.js`.
3. Add a colour variable in `src/styles/atlas.css` and extend `LAYER_COLORS` in `src/atlas/markers.js`.
4. Add a toggle button in `index.html`.

---

## Artwork

```
public/assets/mythological/   ← Mythological Cycle images
public/assets/ulster/         ← Ulster Cycle images
public/assets/fenian/         ← Fenian Cycle images
public/assets/places/         ← Photography reserve
```

**Format:** `.webp`, 16:9 aspect ratio, minimum 800×450px.  
**Naming:** must match `imageFile` exactly.

When absent, the panel shows a dark placeholder with the entry name and "Artwork pending." The data stands alone without illustration.

---

## What is accurate vs approximate

**HIGH** — Location archaeologically confirmed or explicitly named in a primary medieval text. Examples: Hill of Tara, Emain Macha (Navan Fort), Rathcroghan, Newgrange, Kildare, Slieve Gullion, Ben Bulben.

**MEDIUM** — Traditional identification recorded in medieval or early modern Irish sources, but exact coordinates are approximate or scholarly consensus is not settled. Examples: the two Battle of Mag Tuired locations, Ford of Ferdia (Ardee), Battle of Gabhra site.

**LOW** — Mythological or symbolic. No physical location can be assigned. The marker represents a concept placed in approximate geography. Examples: Tír na nÓg (western sea), Manannán mac Lir.

### The Táin Route
The route from Rathcroghan to Cooley is **interpretive** — the Táin names some places but its exact geography remains debated. Waypoints are plausible, not authoritative. Always shown as a dashed line, always labelled "Interpretive."

---

## Lore policy

> *Every entry is drawn from recorded Irish tradition. Nothing is invented and passed off as old.*

- Sources per entry are real medieval texts or identified later folk tradition.
- Where an association is post-medieval (e.g. Fionn and the Giant's Causeway), the entry says so explicitly.
- Do not add entries without citing a source. Uncertain associations get `confidence: low` and a note.

---

## Next sprint

- **Artwork pass** — 50 illustrations for the placeholder slots
- **Entry search** — text search across names, summaries, counties
- **Related entries** — click a name in `associatedFigures` to jump to that entry
- **Diarmuid & Gráinne route** — equivalent route trace to the Táin, tracking the Pursuit
- **Oisín's return** — animated route from Tír na nÓg to Lough Leane
- **Cycle era timeline** — horizontal bar showing the three cycles relative to each other and to early history
- **Mobile swipe-to-dismiss** panel

---

## Previous chapter

The Otherworld Hearth (Chapter I — animated creature diorama) is preserved on the `archive/otherworld-hearth-prototype` branch and tagged `v0.1-otherworld-hearth`. Fully recoverable.
