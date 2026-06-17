# The Celtic Realm

### Chapter I · The Otherworld Hearth

A whimsical, hand-drawn Irish-folklore companion diorama that runs entirely in your
browser. It is meant to be **left open in the corner of a working day** — alive without
demanding attention. Click a wandering creature to learn a small, true piece of Irish
folklore; open the Táin prelude to begin the great cattle-raid story, beat by beat.

No backend. No login. No build step beyond Vite. All state lives in `localStorage`.

---

## Run it locally

```bash
npm install
npm run dev
```

Vite opens it at <http://localhost:3010>. To make a static build:

```bash
npm run build      # outputs to dist/
npm run preview    # serve the build
```

> Type is loaded from Google Fonts when online and falls back to refined system serifs
> (Iowan Old Style / Palatino / Georgia) when offline — so it still looks handcrafted
> with no network at all.

---

## What's here

### The Garden (V1)
A living storybook map with **five places** and **five good folk** who wander between them.

- **Creatures** — Selkie, Púca, Merrow, Aos Sí (Faerie), Will-o'-the-Wisp.
  Each has four traits (curiosity, mischief, sociability, calm) that bias how it wanders,
  who it greets, and what mood it drifts into.
- **Places** — Moon Pond, Fairy Mound, Stone Circle, Mist Gate, Glowing Kelp Grove.
- **Memory** — as creatures arrive somewhere or meet each other they collect small memory
  tags ("visited the Moon Pond", "traded a riddle with the Púca"). These persist between
  visits and feed the **World Journal**.
- Click any creature for its card: name, species, traits, current mood, recent memories,
  and a short folklore note.
- **Glossary** — plain, accurate notes on the words and beings of the lore.

### The Táin · Prelude (V2)
A calm, 6-beat introduction to *Táin Bó Cúailnge*, the Cattle Raid of Cooley — **only the
prelude**, not the full epic:

1. The Pillow Talk · 2. The Reckoning · 3. The White Bull Defects · 4. Word of the Brown
Bull · 5. The Bargain Fails · 6. The Hosting of Connacht.

Characters appear as symbolic figures on the map. Click a figure (or a cast chip) for a
plain-language explanation. The **"What just happened?"** button summarises the current beat.
Cú Chulainn is only hinted — a shadow at the border — not yet staged.

---

## Folder structure

```
The Celtic Realm/
├─ index.html              # shell: canvas, dock, panels
├─ vite.config.js
├─ src/
│  ├─ main.js              # bootstrap: wires world + UI + story
│  ├─ data/                # ALL content lives here as JSON (see ADDING.md)
│  │  ├─ creatures.json
│  │  ├─ locations.json
│  │  ├─ memories.json     # phrasing templates for memory tags
│  │  ├─ glossary.json
│  │  ├─ story-beats.json
│  │  ├─ characters.json
│  │  └─ artifacts.json
│  ├─ world/
│  │  ├─ world.js          # orchestrator + single render loop + input
│  │  ├─ scene.js          # painted backdrop, mist, ambient motes
│  │  ├─ creature.js       # wandering behaviour, traits, mood, memory
│  │  └─ glyphs.js         # all procedural drawing (no image assets)
│  ├─ ui/ui.js             # creature card, journal, glossary, about
│  ├─ story/story.js       # Story Mode: the Táin prelude
│  ├─ state/store.js       # localStorage persistence
│  └─ styles/
│     ├─ main.css
│     └─ fonts.css
├─ ADDING.md               # how to add creatures, places and story cycles
└─ README.md
```

---

## Art direction

Whimsical Irish folklore as an illustrated storybook map. Soft coastal palette — moss
green, sea blue, mist grey, peat brown, moon gold. Handcrafted, warm, calm, slightly
mysterious. Everything is drawn procedurally with Canvas paths and soft glows; there are
no sprites or stock art. Not Disney, not anime, not a Cartoon Saloon clone.

## On the lore

Every creature, place, glossary entry and story beat is drawn from recorded Irish tradition,
kept simple but accurate. Nothing is AI-invented and presented as old. Sources are noted in
the glossary and on the story bar.

See **[ADDING.md](ADDING.md)** to extend the world.
