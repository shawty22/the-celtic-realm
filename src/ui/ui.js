/* =========================================================================
   ui.js — calm companion panels.
   Renders the creature card, world journal, mythology glossary and about box.
   Pure DOM; reads from the world and the JSON data. No framework.
   ========================================================================= */

import glossaryData from '../data/glossary.json'
import { hexA } from '../world/glyphs.js'

const el = (tag, cls, html) => {
  const n = document.createElement(tag)
  if (cls) n.className = cls
  if (html != null) n.innerHTML = html
  return n
}
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase())
function relTime(ts) {
  const mins = Math.floor((Date.now() - ts) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export class UI {
  constructor(world) {
    this.world = world
    this.card = document.getElementById('creature-card')
    this.slide = document.getElementById('slide-panel')
    this.hint = document.getElementById('hint')
    this.openPanel = null
    this.story = null // assigned by main.js after Story is constructed

    // dock buttons -> slide panels
    document.querySelectorAll('.dock-btn').forEach((b) => {
      b.addEventListener('click', () => this.toggleSlide(b.dataset.panel, b))
    })

    // live journal updates while open
    world.journal.onAdd = () => { if (this.openPanel === 'journal') this.renderJournal() }
  }

  /* ---------- creature card ---------- */
  showCreature(c) {
    const d = c.def
    const tr = c.traits
    this._fadeHint()
    this.card.innerHTML = ''
    this.card.appendChild(el('button', 'panel-close', '✕')).onclick = () => this.card.hidden = true

    // portrait canvas — creature drawn at portrait scale into a circular disc
    const SIZE = 110, DPR = Math.min(window.devicePixelRatio || 1, 2)
    const portrait = document.createElement('canvas')
    portrait.width = SIZE * DPR; portrait.height = SIZE * DPR
    portrait.className = 'creature-portrait'
    portrait.style.boxShadow = `0 0 24px ${d.palette.glow}55, inset 0 0 0 1px rgba(255,255,255,.12)`
    const pctx = portrait.getContext('2d')
    pctx.scale(DPR, DPR)
    const TAU = Math.PI * 2, cx = SIZE / 2, cy = SIZE / 2
    // clip to circle
    pctx.save()
    pctx.beginPath(); pctx.arc(cx, cy, SIZE / 2, 0, TAU); pctx.clip()
    // dark background
    const bg = pctx.createRadialGradient(cx * 0.65, cy * 0.55, 0, cx, cy, SIZE * 0.7)
    bg.addColorStop(0, hexA(d.palette.body, 0.38))
    bg.addColorStop(1, hexA('#08100e', 0.96))
    pctx.fillStyle = bg; pctx.fillRect(0, 0, SIZE, SIZE)
    if (c.portrait && c.portrait.ready) {
      // Cover-fit portrait image into the circular disc
      const img = c.portrait.el
      const scale = Math.max(SIZE / img.naturalWidth, SIZE / img.naturalHeight)
      const sw = img.naturalWidth * scale, sh = img.naturalHeight * scale
      pctx.drawImage(img, (SIZE - sw) / 2, (SIZE - sh) / 2, sw, sh)
    } else {
      c.draw(pctx, cx, cy + 4, 28, d.palette, 0.5, c.mood)
    }
    pctx.restore()

    // header row: portrait left + name/species/mood right
    const header = el('div', 'card-header')
    header.appendChild(portrait)
    const info = el('div', 'card-info')
    info.appendChild(el('h2', null, esc(d.name)))
    info.appendChild(el('p', 'species-line', esc(d.species)))
    info.appendChild(el('span', 'mood', `mood · ${esc(c.mood)}`))
    header.appendChild(info)
    this.card.appendChild(header)

    const traits = el('div', 'traits')
    for (const [name, val] of Object.entries(tr)) {
      const t = el('div', 'trait')
      t.appendChild(el('div', 't-label', `<span>${titleCase(name)}</span><span>${Math.round(val * 100)}</span>`))
      const bar = el('div', 't-bar')
      const fill = el('div', 't-fill'); fill.style.width = '0%'
      bar.appendChild(fill); t.appendChild(bar); traits.appendChild(t)
      requestAnimationFrame(() => { fill.style.width = `${val * 100}%` })
    }
    this.card.appendChild(traits)

    this.card.appendChild(el('div', 'section-h', 'Memories'))
    if (c.memories.length) {
      const ul = el('ul', 'mem-list')
      c.memories.slice(0, 6).forEach((m) => {
        const li = el('li', null, esc(m.text))
        if (m.at) {
          const when = el('span', 'mem-when', relTime(m.at))
          li.appendChild(when)
        }
        ul.appendChild(li)
      })
      this.card.appendChild(ul)
    } else {
      this.card.appendChild(el('p', 'mem-empty', 'No memories yet.'))
    }

    this.card.appendChild(el('div', 'section-h', 'Folklore'))
    this.card.appendChild(el('p', 'folklore', esc(d.folklore)))
    if (d.voice) this.card.appendChild(el('p', 'voice', `It ${esc(d.voice)}.`))

    this.card.hidden = false
  }

  /* ---------- slide panels ---------- */
  toggleSlide(panel, btn) {
    if (panel === 'tain') { this._toggleStory(btn); return }
    document.querySelectorAll('.dock-btn').forEach((b) => b.classList.remove('is-active'))
    if (this.openPanel === panel) { this.slide.hidden = true; this.openPanel = null; return }
    this.openPanel = panel
    btn.classList.add('is-active')
    this.slide.hidden = false
    this.slide.innerHTML = ''
    this.slide.appendChild(el('button', 'panel-close', '✕')).onclick = () => {
      this.slide.hidden = true; this.openPanel = null
      document.querySelectorAll('.dock-btn').forEach((b) => b.classList.remove('is-active'))
    }
    if (panel === 'journal') this.renderJournal()
    else if (panel === 'glossary') this.renderGlossary()
    else if (panel === 'about') this.renderAbout()
  }

  _toggleStory(btn) {
    if (!this.story) return
    document.querySelectorAll('.dock-btn').forEach((b) => b.classList.remove('is-active'))
    if (this.world._mode === 'story') {
      this.world.setMode('garden')
      this.story.leave()
    } else {
      // Close any open slide panel
      this.slide.hidden = true; this.openPanel = null
      this.card.hidden = true
      btn.classList.add('is-active')
      this.world.setMode('story')
      this.story.enter()
    }
  }

  exitStory() {
    this.world.setMode('garden')
    this.story?.leave()
    document.querySelectorAll('.dock-btn').forEach((b) => b.classList.remove('is-active'))
  }

  renderJournal() {
    // keep close button, clear the rest
    this._clearSlideBody()
    this.slide.appendChild(el('h2', null, 'World Journal'))
    this.slide.appendChild(el('p', 'panel-lead', 'A quiet record of what the good folk have done while you watched — and while you didn’t.'))
    const entries = this.world.journal.entries
    if (!entries.length) {
      this.slide.appendChild(el('p', 'journal-empty', 'Nothing written yet. Leave the hearth open a while.'))
      return
    }
    entries.slice(0, 40).forEach((e) => {
      const when = e.at ? `<span class="when">${relTime(e.at)}</span>` : ''
      this.slide.appendChild(el('div', 'journal-line',
        `<span class="who">${esc(e.who)}</span><span class="what">${esc(e.what)}</span>${when}`))
    })
  }

  renderGlossary() {
    this._clearSlideBody()
    this.slide.appendChild(el('h2', null, 'Mythology Glossary'))
    this.slide.appendChild(el('p', 'panel-lead', 'Small, accurate notes on the words and beings of Irish folklore.'))
    glossaryData.entries.forEach((g) => {
      const e = el('div', 'entry')
      e.appendChild(el('p', 'e-term', esc(g.term)))
      if (g.pronunciation) e.appendChild(el('p', 'e-pron', `— “${esc(g.pronunciation)}”`))
      e.appendChild(el('p', 'e-mean', esc(g.meaning)))
      if (g.note) e.appendChild(el('p', 'e-note', esc(g.note)))
      this.slide.appendChild(e)
    })
  }

  renderAbout() {
    this._clearSlideBody()
    this.slide.appendChild(el('h2', null, 'The Otherworld Hearth'))
    this.slide.appendChild(el('p', 'panel-lead',
      'Chapter I of <em>The Celtic Realm</em> — a living illustrated diorama of Irish folklore, made to be left open in the corner of a busy day.'))
    this.slide.appendChild(el('div', 'section-h', 'How to be here'))
    this.slide.appendChild(el('p', 'folklore',
      'Watch the five good folk wander the garden of five places. Click any of them to learn who they are and what they have been remembering. Open <em>The Táin · Prelude</em> to begin the great cattle-raid story, beat by beat.'))
    this.slide.appendChild(el('div', 'section-h', 'A note on the lore'))
    this.slide.appendChild(el('p', 'voice',
      'Every creature, place and story note is drawn from recorded Irish tradition, kept simple but accurate. Nothing here is invented and passed off as old.'))
    const reset = el('button', 'story-controls', 'Forget everything (reset memories)')
    reset.style.cssText = 'margin-top:18px;font-family:var(--sans);font-size:12.5px;border:1px solid var(--panel-edge);background:rgba(255,255,255,.04);color:var(--panel-ink-soft);border-radius:10px;padding:9px 12px;cursor:pointer;'
    reset.onclick = () => { this.world.store.reset(); location.reload() }
    this.slide.appendChild(reset)
  }

  _clearSlideBody() {
    [...this.slide.children].forEach((ch) => { if (!ch.classList.contains('panel-close')) ch.remove() })
  }

  _fadeHint() { if (this.hint) this.hint.classList.add('fade') }
}
