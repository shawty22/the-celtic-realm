# Extending the Hearth

The world is **data-driven**. Almost everything you'd want to add is a JSON edit — no code
changes — because the engine reads `src/data/*.json` at startup and draws from a small set
of reusable procedural glyphs.

---

## Add a creature

Append an object to `src/data/creatures.json` → `creatures[]`:

```json
{
  "id": "dullahan",
  "name": "An Dullahan",
  "species": "Dullahan",
  "glyph": "puca",
  "home": "mist-gate",
  "palette": { "body": "#2a2a30", "glow": "#8a3b3b", "trim": "#c45a4a" },
  "traits": { "curiosity": 0.4, "mischief": 0.7, "sociability": 0.2, "calm": 0.3 },
  "folklore": "A headless rider... (keep it short, keep it accurate).",
  "voice": "speaks only one name, once"
}
```

- `glyph` must be one of the drawn creature forms: `selkie`, `puca`, `merrow`, `faerie`,
  `wisp`. To give a creature a brand-new silhouette, add a function to the `CREATURE` map in
  `src/world/glyphs.js` (each is `(ctx, x, y, scale, palette, t, mood)`), then reference its
  key here.
- `home` must match a location `id`. `traits` are `0..1`.

That's it — reload and the creature wanders in, forms memories, and gets a card.

## Add a location

Append to `src/data/locations.json` → `locations[]`. `x`/`y` are fractions of the canvas
(`0..1`), `radius` is a fraction of the smaller screen dimension. `glyph` is one of `pond`,
`mound`, `stones`, `gate`, `kelp` (or add a new one to `LOCATION` in `glyphs.js`).

## Add glossary terms / memory phrasings

- Glossary: append to `src/data/glossary.json`.
- The little sentences creatures use are templates in `src/data/memories.json`
  (`place`, `meeting`, `idle`). `{place}` and `{other}` are filled at runtime. Add lines
  freely; one is chosen at random.

---

## Add a story cycle (the bigger lift)

Story Mode currently holds **one cycle**: the Táin prelude. The data lives in three files:

- `src/data/story-beats.json` — ordered `beats[]`. Each beat: `title`, `scene` (one
  evocative line), `plain` (the "What just happened?" summary), `cast` (character ids),
  `artifacts` (ids).
- `src/data/characters.json` — symbolic figures. `glyph` is one of `crown`, `shield`,
  `bull-white`, `bull-brown`, `house`, `spear` (add more to `FIGURE` in `glyphs.js`).
- `src/data/artifacts.json` — relics referenced by beats/creatures.

To support **multiple cycles** later (e.g. the full Táin, the Children of Lir, the Voyage
of Bran), the clean next step is:

1. Make `story-beats.json` an array of cycles, each `{ id, cycle, source, beats[] }`.
2. Add a cycle picker to the mode bar (or a dropdown in the story bar).
3. `Story` already keys progress by beat index — extend `state/store.js`'s `story` shape to
   `{ cycle: id, beat, seen }` per cycle.

The rendering, timeline, "What just happened?", and click-to-explain all stay as they are —
they read whatever cycle is active.

---

## Design rules to keep

- **No combat, no login, no multiplayer, no open world.** This is a calm companion.
- **Lore must be real.** Keep notes short, sourced, and accurate; don't invent and pass off.
- **One render loop.** All animation goes through `world.js`'s loop; don't start a second
  `requestAnimationFrame`.
- **Draw, don't import.** Prefer a new procedural glyph over a PNG, to keep the handcrafted
  look consistent and the app asset-free.
