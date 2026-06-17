/* =========================================================================
   creature.js — a small living being.
   Wanders between locations, lingers, forms memory tags, and drifts in mood.
   Behaviour is biased by four traits: curiosity, mischief, sociability, calm.
   No combat, no goals beyond gentle wandering — it should feel alive, not busy.
   ========================================================================= */

import { CREATURE } from './glyphs.js'

const rand = (a, b) => a + Math.random() * (b - a)
const pick = (arr) => arr[(Math.random() * arr.length) | 0]
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by)

// moods are chosen from trait balance + recent event; purely cosmetic flavour
const MOODS = {
  serene:      (tr) => tr.calm,
  curious:     (tr) => tr.curiosity,
  mischievous: (tr) => tr.mischief,
  sociable:    (tr) => tr.sociability,
  wistful:     (tr) => 1 - tr.mischief,
  drowsy:      (tr) => tr.calm * 0.7
}

export class Creature {
  constructor(def, world) {
    this.def = def
    this.world = world
    this.id = def.id
    this.traits = def.traits
    this.palette = def.palette
    this.glyph = def.glyph
    this.draw = CREATURE[def.glyph] || CREATURE.faerie

    this.scale = rand(26, 32)
    this.target = { x: 0, y: 0 }
    this.placeAtHome()

    this.state = 'linger'
    this.timer = rand(2, 6)
    this.mood = 'serene'
    this.memories = world.store.memoriesFor(def.id) // persisted tags
    this.lastMet = {}
    this._chooseMood()
  }

  /** drop the creature at (or near) its home location */
  placeAtHome() {
    const home = this.world.locationById(this.def.home) || this.world.locations[0]
    this.x = home.px + rand(-30, 30)
    this.y = home.py + rand(-20, 20)
    this.target.x = this.x
    this.target.y = this.y
    this.atLocation = home.id
    this.state = 'linger'
    this.timer = rand(1, 4)
  }

  /** pick a place to wander toward, weighted by curiosity */
  _roam() {
    const locs = this.world.locations
    let dest
    if (Math.random() < this.traits.curiosity) {
      // curious ones venture far; calm ones tend to stay near home
      dest = pick(locs)
    } else {
      dest = this.world.locationById(this.def.home) || pick(locs)
    }
    this.target = {
      x: dest.px + rand(-dest.pr * 0.5, dest.pr * 0.5),
      y: dest.py + rand(-dest.pr * 0.35, dest.pr * 0.35)
    }
    this.destId = dest.id
    this.state = 'travel'
    // calm creatures move slower
    this.speed = rand(14, 30) * (1.3 - this.traits.calm * 0.6)
  }

  _chooseMood() {
    // weighted random over mood weights, with a little noise
    let best = 'serene', bestW = -1
    for (const [name, fn] of Object.entries(MOODS)) {
      const w = fn(this.traits) * rand(0.6, 1.4)
      if (w > bestW) { bestW = w; best = name }
    }
    this.mood = best
  }

  _remember(text) {
    this.memories.unshift({ text, at: Date.now() })
    if (this.memories.length > 12) this.memories.pop()
    this.world.store.saveMemories(this.id, this.memories)
    this.world.journal.add(this.def.name, text)
  }

  arriveAt(loc) {
    this.atLocation = loc.id
    if (this._lastTag !== loc.id) {
      const tpl = pick(this.world.memoryTemplates.place)
      this._remember(tpl.replace('{place}', loc.name))
      this._lastTag = loc.id
    }
  }

  /** encounter another creature nearby */
  meet(other) {
    const key = other.id
    const now = Date.now()
    if (this.lastMet[key] && now - this.lastMet[key] < 30000) return
    this.lastMet[key] = now
    // sociable creatures note the meeting warmly; shy ones keep distance
    const tpl = this.traits.sociability > 0.45
      ? pick(this.world.memoryTemplates.meeting.slice(0, 3))
      : this.world.memoryTemplates.meeting[3]
    this._remember(tpl.replace('{other}', other.def.name))
  }

  update(dt) {
    this.timer -= dt
    if (this.state === 'linger') {
      if (this.timer <= 0) {
        if (Math.random() < 0.25 * (1 - this.traits.curiosity)) {
          // a quiet idle thought
          this._remember(pick(this.world.memoryTemplates.idle))
        }
        this._chooseMood()
        this._roam()
      }
    } else if (this.state === 'travel') {
      const dx = this.target.x - this.x
      const dy = this.target.y - this.y
      const d = Math.hypot(dx, dy)
      if (d < 4) {
        const loc = this.world.locationById(this.destId)
        if (loc) this.arriveAt(loc)
        this.state = 'linger'
        this.timer = rand(3, 9) * (0.6 + this.traits.calm)
      } else {
        const step = Math.min(d, this.speed * dt)
        this.x += (dx / d) * step
        this.y += (dy / d) * step
        // gentle wander noise so motion isn't a straight line
        this.x += Math.sin((this.world.t + this.scale) * 2) * 0.4
      }
    }
  }

  render(ctx, t) {
    this.draw(ctx, this.x, this.y, this.scale, this.palette, t, this.mood)
  }

  hit(px, py) {
    return dist(px, py, this.x, this.y) < this.scale * 1.4
  }
}
