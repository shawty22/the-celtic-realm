/* =========================================================================
   story.js — Story Mode: The Táin, Prelude.
   A 6-beat illuminated-manuscript walk through the opening of the cattle-raid.
   Symbolic character figures are drawn on the map; the bar below carries the
   timeline, the scene line, the cast, and the "What just happened?" summary.
   Mythology is kept accurate but plain. This is ONLY the prelude.
   ========================================================================= */

import beatsData from '../data/story-beats.json'
import charactersData from '../data/characters.json'
import artifactsData from '../data/artifacts.json'
import { FIGURE, glow } from '../world/glyphs.js'

const el = (tag, cls, html) => {
  const n = document.createElement(tag)
  if (cls) n.className = cls
  if (html != null) n.innerHTML = html
  return n
}
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))

export class Story {
  constructor(world, ui) {
    this.world = world
    this.ui = ui
    this.bar = document.getElementById('story-bar')
    this.beats = beatsData.beats
    this.chars = Object.fromEntries(charactersData.characters.map((c) => [c.id, c]))
    this.artifacts = Object.fromEntries(artifactsData.artifacts.map((a) => [a.id, a]))

    const saved = world.store.storyState()
    this.index = Math.min(saved.beat || 0, this.beats.length - 1)
    this.seen = new Set(saved.seen || [])
    this.showSummary = false
    this.figures = [] // {id, x, y, r} laid out for the current beat

    // hook the world's story render + hit-testing
    world.storyRender = (ctx, w, h, t) => this._renderFigures(ctx, w, h, t)
    world.storyHit = (x, y) => this._hit(x, y)
    world.storyOver = (x, y) => this._figureAt(x, y)
  }

  enter() {
    this.bar.hidden = false
    this._layout()
    this._renderBar()
  }

  leave() {
    this.bar.hidden = true
  }

  get beat() { return this.beats[this.index] }

  _save() {
    this.world.store.saveStory({ beat: this.index, seen: [...this.seen] })
  }

  go(i) {
    this.index = Math.max(0, Math.min(this.beats.length - 1, i))
    this.showSummary = false
    this._layout()
    this._renderBar()
    this._save()
  }

  /* place the beat's cast as symbolic figures across the map */
  _layout() {
    const cast = this.beat.cast
    const w = this.world.W, h = this.world.H
    this.figures = cast.map((id, i) => {
      const n = cast.length
      const fx = w * (0.5 + (i - (n - 1) / 2) * 0.2)
      const fy = h * 0.4 + Math.sin(i * 1.3) * h * 0.05
      return { id, x: fx, y: fy, r: Math.min(w, h) * 0.07 }
    })
  }

  _renderFigures(ctx, w, h, t) {
    // title cartouche for the beat
    ctx.save()
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(233,216,166,0.85)'
    ctx.font = '500 15px "Avenir Next", system-ui, sans-serif'
    ctx.fillText(`THE TÁIN · PRELUDE — BEAT ${this.index + 1} OF ${this.beats.length}`, w / 2, h * 0.2)
    ctx.restore()

    for (const f of this.figures) {
      const ch = this.chars[f.id]
      if (!ch) continue
      const bob = Math.sin(t * 1.2 + f.x) * f.r * 0.06
      const fn = FIGURE[ch.glyph] || FIGURE.shield
      fn(ctx, f.x, f.y + bob, f.r, ch.palette)
      // hinted characters drawn faint
      if (ch.title.includes('awaited')) {
        ctx.save(); ctx.globalAlpha = 0.4
        glow(ctx, f.x, f.y + bob, f.r * 1.6, ch.palette.glow, 0.3)
        ctx.restore()
      }
      // name beneath
      ctx.save()
      ctx.textAlign = 'center'
      ctx.fillStyle = 'rgba(236,227,207,0.9)'
      ctx.font = '500 14px "Cormorant Garamond", Georgia, serif'
      ctx.fillText(ch.name, f.x, f.y + f.r + 22)
      ctx.fillStyle = 'rgba(183,172,147,0.7)'
      ctx.font = '500 10px "Avenir Next", system-ui, sans-serif'
      ctx.fillText(ch.title.toUpperCase(), f.x, f.y + f.r + 38)
      ctx.restore()
    }
  }

  _figureAt(x, y) {
    return this.figures.find((f) => Math.hypot(f.x - x, f.y - y) < f.r * 1.3)
  }

  _hit(x, y) {
    const f = this._figureAt(x, y)
    if (f) this._showCharacter(this.chars[f.id])
  }

  /* reuse the left slide panel to explain a clicked figure */
  _showCharacter(ch) {
    const slide = this.ui.slide
    this.ui.openPanel = 'story-char'
    document.querySelectorAll('.dock-btn').forEach((b) => b.classList.remove('is-active'))
    slide.hidden = false
    slide.innerHTML = ''
    slide.appendChild(el('button', 'panel-close', '✕')).onclick = () => { slide.hidden = true; this.ui.openPanel = null }
    slide.appendChild(el('h2', null, esc(ch.name)))
    slide.appendChild(el('p', 'species-line', `${esc(ch.title)}${ch.pronunciation ? ` · “${esc(ch.pronunciation)}”` : ''}`))
    const sw = el('div', 'swatch')
    sw.style.background = `radial-gradient(circle at 35% 30%, ${ch.palette.glow}, ${ch.palette.deep} 75%)`
    slide.appendChild(sw)
    slide.appendChild(el('p', 'folklore', esc(ch.plain)))

    // any artifacts of this beat that relate to the character
    const rel = (this.beat.artifacts || [])
      .map((id) => this.artifacts[id])
      .filter((a) => a && a.related.includes(ch.id))
    if (rel.length) {
      slide.appendChild(el('div', 'section-h', 'Of note here'))
      rel.forEach((a) => {
        const e = el('div', 'entry')
        e.appendChild(el('p', 'e-term', esc(a.name)))
        e.appendChild(el('p', 'e-mean', esc(a.plain)))
        slide.appendChild(e)
      })
    }
  }

  _renderBar() {
    const b = this.beat
    this.seen.add(b.id)
    this.bar.innerHTML = ''

    // close / exit story mode
    const closeBtn = el('button', 'panel-close', '✕')
    closeBtn.onclick = () => this.ui.exitStory()
    this.bar.appendChild(closeBtn)

    // timeline pips
    const tl = el('div', 'timeline')
    this.beats.forEach((bt, i) => {
      const pip = el('button', 'beat-pip')
      if (i === this.index) pip.classList.add('is-active')
      else if (this.seen.has(bt.id)) pip.classList.add('is-seen')
      pip.appendChild(el('div', 'pip-rail', '<span></span>'))
      pip.appendChild(el('div', 'pip-num', `Beat ${i + 1}`))
      pip.appendChild(el('div', 'pip-title', esc(bt.title)))
      pip.onclick = () => this.go(i)
      tl.appendChild(pip)
    })
    this.bar.appendChild(tl)

    // body: scene + controls
    const body = el('div', 'story-body')
    const text = el('div', 'story-text')
    text.appendChild(el('p', 'story-scene', `“${esc(b.scene)}”`))
    const plain = el('p', `story-plain${this.showSummary ? ' show' : ''}`, esc(b.plain))
    text.appendChild(plain)

    // cast chips
    const cast = el('div', 'story-cast')
    b.cast.forEach((id) => {
      const ch = this.chars[id]; if (!ch) return
      const chip = el('button', 'cast-chip')
      const dot = el('span', 'cast-dot'); dot.style.background = ch.palette.glow
      chip.appendChild(dot)
      chip.appendChild(document.createTextNode(ch.name))
      chip.onclick = () => this._showCharacter(ch)
      cast.appendChild(chip)
    })
    text.appendChild(cast)
    body.appendChild(text)

    // controls
    const ctrl = el('div', 'story-controls')
    const whatBtn = el('button', 'primary', this.showSummary ? 'Hide explanation' : 'What just happened?')
    whatBtn.onclick = () => { this.showSummary = !this.showSummary; this._renderBar() }
    ctrl.appendChild(whatBtn)
    const row = el('div', 'step-row')
    const prev = el('button', null, '← Back'); prev.disabled = this.index === 0
    prev.onclick = () => this.go(this.index - 1)
    const next = el('button', null, 'Next →'); next.disabled = this.index === this.beats.length - 1
    next.onclick = () => this.go(this.index + 1)
    row.appendChild(prev); row.appendChild(next)
    ctrl.appendChild(row)
    ctrl.appendChild(el('p', 'story-source', esc(beatsData.source)))
    body.appendChild(ctrl)

    this.bar.appendChild(body)
    this._save()
  }
}
