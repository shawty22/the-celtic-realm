/* =========================================================================
   scene.js — ambient motes floating over each realm.
   Hills and landscape are now provided by the background image layer.
   This file only draws the firefly / spore motes on the 2D world canvas.
   ========================================================================= */

import { glow, hexA } from './glyphs.js'

const TAU = Math.PI * 2
const rand = (a, b) => a + Math.random() * (b - a)

export class Scene {
  constructor() {
    this.motes = []
  }

  seed(w, h) {
    this.motes = []
    const n = Math.round((w * h) / 28000)
    for (let i = 0; i < n; i++) {
      this.motes.push({
        x: rand(0, w),
        y: rand(0, h),
        r: rand(0.7, 2.4),
        spd: rand(5, 18),
        drift: rand(-10, 10),
        phase: rand(0, TAU),
        warm: Math.random() < 0.38
      })
    }
  }

  drawMotes(ctx, w, h, t) {
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    for (const m of this.motes) {
      m.y -= m.spd * 0.016
      m.x += Math.sin(t * 0.48 + m.phase) * m.drift * 0.016
      if (m.y < -12) { m.y = h + 12; m.x = rand(0, w) }
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.4 + m.phase))
      const color = m.warm ? '#e9d8a6' : '#b8dcf0'
      glow(ctx, m.x, m.y, m.r * 5, color, 0.16 * tw)
      ctx.fillStyle = hexA(color, 0.72 * tw)
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, TAU); ctx.fill()
    }
    ctx.restore()
  }
}
