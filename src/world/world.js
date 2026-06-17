/* =========================================================================
   world.js — realm orchestrator.
   Manages the three-layer canvas stack (bg / atm / world) across five
   separate full-screen realm screens. Handles realm switching, creature
   rendering, click routing, and the animation loop.
   ========================================================================= */

import { BackgroundLayer } from './background.js'
import { Atmosphere, NCREATURE } from './gl/atmosphere.js'
import { Scene } from './scene.js'
import { CREATURE, glow, hexA } from './glyphs.js'

import realmsData from '../data/realms.json'
import creaturesData from '../data/creatures.json'

const rand = (a, b) => a + Math.random() * (b - a)

function _moodFrom(traits) {
  const t = traits
  if (!t) return 'serene'
  const dominant = Object.entries(t).reduce((a, b) => b[1] > a[1] ? b : a, ['', -1])
  const map = {
    calm:        ['tranquil', 'serene', 'still'],
    curiosity:   ['curious', 'attentive', 'watchful'],
    mischief:    ['mischievous', 'restless', 'playful'],
    sociability: ['gentle', 'open', 'present'],
  }
  const pool = map[dominant[0]] || ['serene']
  return pool[Math.floor(Math.random() * pool.length)]
}

// Encounter memories — added to a creature's personal card when a visitor looks at them.
// Phrased as the creature's own recollection: "I was seen …"
const SEEN = {
  selkie: [
    'felt a gaze from the shore and turned, half-curious',
    'surfaced to find eyes watching from the bank',
    'paused mid-stroke — someone was there, looking',
    'met a visitor at the water\'s edge',
    'lifted her head from the deep and was not alone',
  ],
  puca: [
    'froze in shadow when it sensed a presence',
    'grinned — someone finally noticed it was there',
    'regarded the newcomer with tilted head',
    'decided not to disappear, this once',
    'let itself be seen, which it doesn\'t often allow',
  ],
  faerie: [
    'felt something watching and chose not to vanish',
    'lowered her hands slowly when she heard footsteps',
    'turned to find a visitor standing in the light',
    'acknowledged a quiet presence in the grove',
    'paused her work and held the gaze for a long moment',
  ],
  wisp: [
    'brightened once when it knew it was being watched',
    'hovered closer, just briefly, to be seen',
    'pulsed twice — a greeting, or a warning',
    'let a stranger observe it without retreating',
    'drifted to within arm\'s reach, then thought better of it',
  ],
  raven: [
    'recorded the visitor\'s face in perfect detail',
    'tilted its head — cataloguing',
    'noted a new presence without surprise',
    'fixed one eye on the stranger and did not blink',
    'filed the encounter away, to remember it later',
  ],
}

const AMBIENT = {
  selkie: [
    'turned to gaze at her reflection in the water',
    'let the current move through her hair',
    'slipped beneath the surface, briefly',
    'hummed something older than the standing stones',
    'pressed her ear to the water and listened',
  ],
  puca: [
    'crouched in the shadow of the arch, watching',
    'left a riddle scratched into the lichen',
    'shapeshifted into something small and quick',
    'grinned at a joke only it understood',
    'untied something that had not been tied',
  ],
  faerie: [
    'pressed her palm against the old tree bark',
    'whispered a name no one else remembered',
    'braided a thread of morning into her hair',
    'stood very still, listening for something far off',
    'scattered a handful of petals for no reason',
  ],
  wisp: [
    'drifted into the passage and back again',
    'hovered at the threshold of the mound',
    'flickered twice and then went calm',
    'left a small cold light on the ground stone',
    'spiralled upward, then descended slowly',
  ],
  raven: [
    'tilted its head to a sound no one else heard',
    'rearranged a memory inside its chest',
    'called once across the meadow, then was silent',
    'watched the horizon without blinking',
    'turned its eye to the east, then the west',
  ],
}

function _hexToF3(hex) {
  if (!hex || hex[0] !== '#') return [0, 0, 0]
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]
}

function _slug(name) {
  return name.toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

export class World {
  constructor(bgCanvas, atmCanvas, worldCanvas, store) {
    this.store = store
    this.canvas = worldCanvas
    this.ctx = worldCanvas.getContext('2d')

    this.bg  = new BackgroundLayer(bgCanvas)
    this.atm = new Atmosphere(atmCanvas)
    this.scene = new Scene()

    this.realms = realmsData.realms
    this.allCreatures = creaturesData.creatures

    this.activeRealm = null
    this.realmCreatures = []
    this.atmUniforms = null

    this.t = 0
    this.last = 0
    this.mouseX = 0.5
    this.mouseY = 0.5

    this._W = 0; this._H = 0
    this._transitioning = false
    this._fadeAlpha = 1.0 // 1 = fully visible
    this._hovered = null
    this._raf = null
    this._ambientTimeout = null
    this._mode = 'garden' // 'garden' | 'story'

    // Story-mode callbacks — assigned by Story class at runtime
    this.storyRender = null
    this.storyHit    = null
    this.storyOver   = null

    // Journal interface expected by ui.js
    this.journal = {
      entries: store.journal(),
      onAdd: null,
      add: (who, what) => {
        const entry = { who, what, at: Date.now() }
        store.pushJournal(entry)
        this.journal.entries = store.journal()
        this.journal.onAdd?.(entry)
      }
    }

    this.onSelect = null
    this.onRealmChange = null

    this._resize()
    window.addEventListener('resize', () => this._resize())
    this._bindInput()

    // Load the first realm immediately
    this.switchRealm(this.realms[0].id, true)

    // Ambient journal entries — begin after a short settling delay
    setTimeout(() => this._scheduleAmbient(), 40000)
  }

  /* ---- public API ---- */

  switchRealm(id, instant = false) {
    const realm = this.realms.find(r => r.id === id)
    if (!realm) return
    if (!instant && realm === this.activeRealm) return

    if (instant) {
      this._applyRealm(realm)
      return
    }

    // Crossfade: fade out → switch → fade in
    this._transitioning = true
    const start = performance.now()
    const fadeOut = () => {
      const p = (performance.now() - start) / 380
      this._fadeAlpha = Math.max(0, 1 - p)
      if (p < 1) { requestAnimationFrame(fadeOut); return }
      this._applyRealm(realm)
      const fadeStart = performance.now()
      const fadeIn = () => {
        const q = (performance.now() - fadeStart) / 420
        this._fadeAlpha = Math.min(1, q)
        if (q < 1) { requestAnimationFrame(fadeIn); return }
        this._transitioning = false
      }
      requestAnimationFrame(fadeIn)
    }
    requestAnimationFrame(fadeOut)
  }

  get activeRealmId() { return this.activeRealm?.id ?? null }
  get W() { return this._W }
  get H() { return this._H }

  setMode(mode) { this._mode = mode }

  // Compat stub for journal (ui.js calls this)
  locationById() { return null }

  start() {
    const loop = (ts) => {
      const dt = this.last ? Math.min((ts - this.last) / 1000, 0.05) : 0.016
      this.last = ts
      this.t += dt
      this._render()
      this._raf = requestAnimationFrame(loop)
    }
    this._raf = requestAnimationFrame(loop)
  }

  /* ---- private ---- */

  _applyRealm(realm) {
    this.activeRealm = realm
    this._hovered = null
    this.bg.load(realm)
    this._loadCreatures(realm)
    this._buildAtmUniforms(realm)
    this.onRealmChange?.(realm)
    this.scene.seed(this._W, this._H)
  }

  _loadCreatures(realm) {
    const base = Math.min(this._W, this._H) * 0.080
    const scaleMap = { raven: 1.14, selkie: 1.05 }
    // Per-glyph wander radius: X is horizontal drift, Y is vertical drift
    const wanderMap = {
      wisp:   { x: 0.040, y: 0.030 },  // freely floating
      faerie: { x: 0.030, y: 0.020 },  // gentle flight
      selkie: { x: 0.022, y: 0.007 },  // at the waterline, little vertical
      puca:   { x: 0.028, y: 0.010 },  // skulks left-right
      raven:  { x: 0.010, y: 0.005 },  // perched, nearly still
    }

    this.realmCreatures = realm.creatures.map(id => {
      const def = this.allCreatures.find(c => c.id === id)
      if (!def) return null
      const pos = realm.creaturePositions[id] || { x: 0.5, y: 0.65 }
      const drawFn = CREATURE[def.glyph] || CREATURE.faerie
      const scale = base * (scaleMap[def.glyph] || 1.0)
      const nameSlug = `${_slug(def.name)}-${def.glyph}`

      // Sprite: in-world figure
      const imgSlot = { el: null, ready: false }
      const spriteImg = new Image()
      spriteImg.onload = () => { imgSlot.el = spriteImg; imgSlot.ready = true }
      spriteImg.src = `/assets/characters/${nameSlug}-sprite.webp`

      // Portrait: creature card disc
      const portSlot = { el: null, ready: false }
      const portImg = new Image()
      portImg.onload = () => { portSlot.el = portImg; portSlot.ready = true }
      portImg.src = `/assets/characters/${nameSlug}-portrait.webp`

      const wp = wanderMap[def.glyph] || { x: 0.026, y: 0.014 }
      return {
        id: def.id,
        def,
        traits: def.traits,
        palette: def.palette,
        draw: drawFn,
        homeX: pos.x,
        homeY: pos.y,
        relX: pos.x,
        relY: pos.y,
        wanderPhase: rand(0, Math.PI * 2),
        wanderSpeed: rand(0.06, 0.14),
        wanderRadiusX: wp.x,
        wanderRadiusY: wp.y,
        scale,
        bobPhase: rand(0, Math.PI * 2),
        mood: _moodFrom(def.traits),
        memories: this.store.memoriesFor?.(def.id) ?? [],
        img: imgSlot,
        portrait: portSlot
      }
    }).filter(Boolean)
  }

  _buildAtmUniforms(realm) {
    const atm = realm.atmosphere
    const crPos = new Float32Array(NCREATURE * 2).fill(-2)
    const crCol = new Float32Array(NCREATURE * 3).fill(0)
    const crOn  = new Float32Array(NCREATURE).fill(0)

    this.realmCreatures.slice(0, NCREATURE).forEach((c, i) => {
      crPos[i * 2]     = c.relX
      crPos[i * 2 + 1] = 1.0 - c.relY  // GLSL UV: y=0 at bottom
      const [r, g, b] = _hexToF3(c.palette.glow)
      crCol[i * 3] = r; crCol[i * 3 + 1] = g; crCol[i * 3 + 2] = b
      crOn[i] = 1
    })

    this.atmUniforms = {
      mode:    realm.atmosphereMode,
      moon:    new Float32Array(atm.moon),
      mistCol: new Float32Array(atm.mistColor),
      mistStr: atm.mistStrength,
      glowA:   new Float32Array(atm.glowA),
      glowB:   new Float32Array(atm.glowB),
      crPos, crCol, crOn
    }
  }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = window.innerWidth, h = window.innerHeight
    if (!w || !h) return
    this._W = w; this._H = h

    // Background (slightly oversized for parallax)
    this.bg.resize(w, h)

    // Atmosphere (exact viewport)
    this.atm.resize(w, h, dpr)

    // World canvas (2D, exact viewport)
    this.canvas.width  = w * dpr
    this.canvas.height = h * dpr
    this.canvas.style.width  = w + 'px'
    this.canvas.style.height = h + 'px'
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    this.scene.seed(w, h)
    if (this.activeRealm) this._buildAtmUniforms(this.activeRealm)
  }

  _render() {
    const { ctx, _W: W, _H: H, t } = this
    if (!W || !H) return

    // 1) Background parallax drift
    this.bg.drift(this.mouseX, this.mouseY, t)

    // 2) WebGL atmosphere overlay — sync creature glow positions to current wander
    if (this.atmUniforms) {
      this.realmCreatures.slice(0, NCREATURE).forEach((c, i) => {
        const wx = Math.sin(t * c.wanderSpeed + c.wanderPhase) * c.wanderRadiusX
        const wy = Math.cos(t * c.wanderSpeed * 0.71 + c.wanderPhase + 1.4) * c.wanderRadiusY
        this.atmUniforms.crPos[i * 2]     = c.homeX + wx
        this.atmUniforms.crPos[i * 2 + 1] = 1.0 - (c.homeY + wy)
      })
      this.atm.render({ time: t, ...this.atmUniforms })
    }

    // 3) 2D world canvas
    ctx.clearRect(0, 0, W, H)

    if (this._fadeAlpha < 1) {
      const inv = 1 - this._fadeAlpha
      // Dark veil
      ctx.fillStyle = `rgba(4,6,12,${Math.min(inv * 0.96, 0.92)})`
      ctx.fillRect(0, 0, W, H)
      // Portal flash at transition peak
      if (inv > 0.68) {
        this._drawPortal(ctx, W, H, (inv - 0.68) / 0.32)
      }
    }

    if (!this._transitioning || this._fadeAlpha > 0.5) {
      this._drawCreatures(ctx, W, H, t)
    }

    // Motes always draw at fade alpha
    if (this._fadeAlpha > 0.1) {
      ctx.save()
      ctx.globalAlpha = this._fadeAlpha
      this.scene.drawMotes(ctx, W, H, t)
      ctx.restore()
    }

    // Story mode figures drawn on top
    if (this._mode === 'story') {
      this.storyRender?.(ctx, W, H, t)
    }
  }

  _drawCreatures(ctx, W, H, t) {
    for (const c of this.realmCreatures) {
      // Gentle wander: independent X/Y sines at different frequencies, creature-typed radii
      c.relX = c.homeX + Math.sin(t * c.wanderSpeed + c.wanderPhase) * c.wanderRadiusX
      c.relY = c.homeY + Math.cos(t * c.wanderSpeed * 0.71 + c.wanderPhase + 1.4) * c.wanderRadiusY

      const px = c.relX * W
      const py = c.relY * H
      const bob = Math.sin(t * 1.15 + c.bobPhase) * c.scale * 0.04

      if (c.img.ready) {
        const imgH = c.scale * 3.2
        const imgW = imgH * (c.img.el.naturalWidth / c.img.el.naturalHeight)
        // Build (or rebuild on scale change) a vignetted OffscreenCanvas
        if (!c.img.ofc || c.img.ofcScale !== c.scale) {
          c.img.ofc = this._buildSpriteCanvas(c.img.el, imgW, imgH)
          c.img.ofcScale = c.scale
        }
        glow(ctx, px, py + bob, c.scale * 1.8, c.palette.glow, 0.32)
        ctx.drawImage(c.img.ofc, px - imgW / 2, py - imgH / 2 + bob)
      } else {
        c.draw(ctx, px, py + bob, c.scale, c.palette, t, c.mood)
      }

      // Hover name label
      if (c === this._hovered && !this._transitioning) {
        const labelY = py - (c.img.ready ? (c.scale * 3.2) / 2 : c.scale) + bob - 8
        const fontSize = Math.max(14, Math.round(c.scale * 0.72))
        ctx.save()
        ctx.globalAlpha = 0.90
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.font = `500 ${fontSize}px "Cormorant Garamond", Georgia, serif`
        ctx.shadowColor = c.palette.glow
        ctx.shadowBlur = 14
        ctx.fillStyle = 'rgba(255, 248, 218, 1)'
        ctx.fillText(c.def.name, px, labelY)
        ctx.restore()
      }

      // Click ping flash
      if (c._pingT && t - c._pingT < 0.55) {
        const age = t - c._pingT
        glow(ctx, px, py, c.scale * (1.5 + age * 2.8), c.palette.glow,
             0.45 * (1 - age / 0.55))
      }
    }
  }

  _bindInput() {
    const canvas = this.canvas

    canvas.addEventListener('click', (e) => {
      if (this._transitioning) return
      const { px, py } = this._pointer(e)
      if (this._mode === 'story') { this.storyHit?.(px, py); return }
      const hit = this._hitCreature(px, py)
      if (hit) {
        hit._pingT = this.t
        // Record encounter memory before opening the card so the card shows it immediately
        const pool = SEEN[hit.def.glyph] || ['was seen by a visitor']
        const text = pool[Math.floor(Math.random() * pool.length)]
        hit.memories.unshift({ text, at: Date.now() })
        if (hit.memories.length > 12) hit.memories.pop()
        this.store.saveMemories(hit.def.id, hit.memories)
        this.onSelect?.(hit)
        this.journal.add(hit.def.name, `was glimpsed at ${this.activeRealm?.name ?? 'the hearth'}.`)
      }
    })

    canvas.addEventListener('pointermove', (e) => {
      const rect = canvas.getBoundingClientRect()
      this.mouseX = (e.clientX - rect.left) / rect.width
      this.mouseY = (e.clientY - rect.top) / rect.height
      if (!this._transitioning) {
        const { px, py } = this._pointer(e)
        if (this._mode === 'story') {
          canvas.style.cursor = this.storyOver?.(px, py) ? 'pointer' : 'default'
        } else {
          this._hovered = this._hitCreature(px, py)
          canvas.style.cursor = this._hovered ? 'pointer' : 'default'
        }
      }
    })
    canvas.addEventListener('pointerleave', () => { this._hovered = null })
  }

  _pointer(e) {
    const rect = this.canvas.getBoundingClientRect()
    return { px: e.clientX - rect.left, py: e.clientY - rect.top }
  }

  _buildSpriteCanvas(img, w, h) {
    const ofc = new OffscreenCanvas(Math.ceil(w), Math.ceil(h))
    const ofx = ofc.getContext('2d')
    ofx.drawImage(img, 0, 0, w, h)
    // Radial vignette: fade edges to transparent so sprite blends into scene
    ofx.globalCompositeOperation = 'destination-in'
    const cx = w / 2, cy = h * 0.46
    const rx = w * 0.44, ry = h * 0.46
    const vg = ofx.createRadialGradient(cx, cy, Math.min(rx, ry) * 0.3, cx, cy, Math.max(rx, ry) * 1.05)
    vg.addColorStop(0,    'rgba(0,0,0,1)')
    vg.addColorStop(0.55, 'rgba(0,0,0,0.92)')
    vg.addColorStop(0.82, 'rgba(0,0,0,0.40)')
    vg.addColorStop(1,    'rgba(0,0,0,0)')
    ofx.fillStyle = vg
    ofx.fillRect(0, 0, w, h)
    return ofc
  }

  _drawPortal(ctx, W, H, t) {
    const cx = W / 2, cy = H / 2
    // Outer golden haze
    const r1 = Math.max(W, H) * 0.62
    const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, r1)
    g1.addColorStop(0,    `rgba(255,240,180,${t * 0.72})`)
    g1.addColorStop(0.30, `rgba(220,170, 80,${t * 0.50})`)
    g1.addColorStop(0.65, `rgba(160,100, 30,${t * 0.22})`)
    g1.addColorStop(1,     'rgba(120, 60, 10,0)')
    ctx.fillStyle = g1
    ctx.fillRect(0, 0, W, H)
    // Bright central core
    const r2 = Math.min(W, H) * 0.11
    const g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, r2)
    g2.addColorStop(0,    `rgba(255,255,255,${t})`)
    g2.addColorStop(0.40, `rgba(255,230,160,${t * 0.80})`)
    g2.addColorStop(1,     'rgba(255,180, 60,0)')
    ctx.fillStyle = g2
    ctx.fillRect(0, 0, W, H)
    // Realm name reveal at peak
    const nameAlpha = Math.max(0, (t - 0.18) / 0.55) * 0.92
    if (nameAlpha > 0 && this.activeRealm) {
      const nameSize = Math.round(H * 0.065)
      const subSize  = Math.round(H * 0.016)
      ctx.save()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor = 'rgba(255, 200, 60, 0.55)'
      ctx.shadowBlur = 22
      ctx.globalAlpha = nameAlpha
      ctx.fillStyle = 'rgba(255, 248, 218, 1)'
      ctx.font = `500 ${nameSize}px "Cormorant Garamond", Georgia, serif`
      ctx.fillText(this.activeRealm.name, cx, cy - nameSize * 0.52)
      if (this.activeRealm.subtitle) {
        ctx.globalAlpha = nameAlpha * 0.62
        ctx.shadowBlur = 10
        ctx.font = `500 ${subSize}px "Avenir Next", system-ui, sans-serif`
        ctx.letterSpacing = '0.22em'
        ctx.fillText(this.activeRealm.subtitle.toUpperCase(), cx, cy + nameSize * 0.58)
      }
      ctx.restore()
    }
  }

  _scheduleAmbient() {
    const delay = 60000 + Math.random() * 60000 // 60–120 s
    this._ambientTimeout = setTimeout(() => {
      this._addAmbientEntry()
      this._scheduleAmbient()
    }, delay)
  }

  _addAmbientEntry() {
    if (!this.realmCreatures.length) return
    const c = this.realmCreatures[Math.floor(Math.random() * this.realmCreatures.length)]
    const pool = AMBIENT[c.def.glyph] || ['drifted quietly through the realm']
    const what = pool[Math.floor(Math.random() * pool.length)]
    this.journal.add(c.def.name, what)
  }

  _hitCreature(px, py) {
    return this.realmCreatures.find(c => {
      const cx = c.relX * this._W
      const cy = c.relY * this._H
      return Math.hypot(px - cx, py - cy) < c.scale * 1.65
    }) ?? null
  }
}
