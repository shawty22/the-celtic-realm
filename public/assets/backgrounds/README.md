# Background Art Assets

One full-screen painterly image per realm. Drop final art here — the app loads
it automatically and shows the built-in placeholder until the file arrives.

## Expected filenames

| File                    | Realm                      | Palette         |
|-------------------------|----------------------------|-----------------|
| moon-pond.png           | Moon Pond (Loch na Gealaí) | Deep navy/teal, moonlit water, standing stones |
| brigids-grove.png       | Brigid's Grove             | Ancient dark forest, sacred flame, deep green canopy |
| fairy-mound.png         | Fairy Mound                | Purple twilight sky, rolling green hill, glowing doorway |
| mist-gate.png           | Mist Gate (Geata an Cheo)  | Grey-blue mist, ivy stone arch, thick rolling fog |
| tir-na-nog-meadow.png   | Tír na nÓg                 | Warm golden light, rolling green meadow, bright sky |

## Art direction

- **Size**: 2560×1440 or larger (landscape). The app cover-fits the image.
- **Style**: Painterly — oil or gouache quality. Cartoon Saloon inspiration: bold
  flat shapes, hand-drawn line quality, rich saturated colour fields.
- **Mood**: Each realm should feel like a single establishing shot from an
  animated film — one strong composition, atmospheric depth.
- **Light**: Each realm has a primary light source (moon, fire, twilight, sun)
  that should read clearly from across the room.

The image is rendered as a static layer with subtle CSS parallax drift (±1%).
Characters are drawn on top. WebGL adds mist, particles, glow, and light shafts
over the image — keep the image itself relatively clean.
