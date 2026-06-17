/* =========================================================================
   glyphs.js — procedural illustration
   Each draw fn is pure: (ctx, x, y, scale, palette, t) where t is seconds.
   ========================================================================= */

const TAU = Math.PI * 2

export function glow(ctx, x, y, r, color, alpha = 0.5) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, hexA(color, alpha))
  g.addColorStop(0.5, hexA(color, alpha * 0.35))
  g.addColorStop(1, hexA(color, 0))
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, r, 0, TAU)
  ctx.fill()
}

/* ── locations ─────────────────────────────────────────────────────────── */

export const LOCATION = {

  pond(ctx, x, y, s, p, t) {
    glow(ctx, x, y, s * 1.7, p.glow, 0.13)

    ctx.save()
    ctx.translate(x, y)
    ctx.scale(1, 0.60)

    // clip to oval
    ctx.beginPath(); ctx.arc(0, 0, s, 0, TAU); ctx.clip()

    // deep black mirror water
    const wg = ctx.createRadialGradient(0, 0, 0, 0, 0, s)
    wg.addColorStop(0, hexA('#060c12', 0.94))
    wg.addColorStop(0.55, hexA(p.deep, 0.96))
    wg.addColorStop(1, hexA(shade(p.deep, -14), 0.98))
    ctx.fillStyle = wg
    ctx.beginPath(); ctx.arc(0, 0, s, 0, TAU); ctx.fill()

    // moonlight path — bright diagonal shimmer
    ctx.save()
    ctx.rotate(-0.38)
    const pg = ctx.createLinearGradient(-s, 0, s, 0)
    pg.addColorStop(0, hexA(p.accent, 0))
    pg.addColorStop(0.38, hexA(p.accent, 0.03))
    pg.addColorStop(0.5, hexA('#ffffff', 0.14 + 0.05 * Math.sin(t * 0.8)))
    pg.addColorStop(0.62, hexA(p.accent, 0.03))
    pg.addColorStop(1, hexA(p.accent, 0))
    ctx.fillStyle = pg
    ctx.fillRect(-s, -s, s * 2, s * 2)
    ctx.restore()

    // moon disc reflection (wobbles gently)
    const rx = -s * 0.15 + Math.sin(t * 0.34) * s * 0.025
    const ry = -s * 0.20 + Math.cos(t * 0.42) * s * 0.018
    const mg = ctx.createRadialGradient(rx, ry, 0, rx, ry, s * 0.26)
    mg.addColorStop(0, hexA('#ffffff', 0.75))
    mg.addColorStop(0.28, hexA(p.accent, 0.38))
    mg.addColorStop(1, hexA(p.accent, 0))
    ctx.fillStyle = mg
    ctx.beginPath(); ctx.arc(rx, ry, s * 0.26, 0, TAU); ctx.fill()

    // ripple rings emanating from center
    for (let i = 0; i < 4; i++) {
      const rr = (s * 0.12 + (t * 22 + i * s * 0.3) % (s * 1.05))
      const a = Math.max(0, 0.2 * (1 - rr / s))
      ctx.strokeStyle = hexA(p.glow, a)
      ctx.lineWidth = 1.0
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.stroke()
    }

    // caustic sparkles drifting across surface
    for (let i = 0; i < 9; i++) {
      const ang = (i / 9) * TAU + t * 0.18
      const dist = s * (0.18 + 0.55 * Math.abs(Math.sin(i * 2.1 + t * 0.6)))
      const bx = Math.cos(ang) * dist, by = Math.sin(ang) * dist
      const tw = 0.5 + 0.5 * Math.sin(t * 2.8 + i * 1.4)
      ctx.fillStyle = hexA('#ffffff', 0.14 * tw)
      ctx.beginPath(); ctx.arc(bx, by, s * 0.022 * tw, 0, TAU); ctx.fill()
    }

    ctx.restore()

    // fresnel rim
    ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.60)
    ctx.strokeStyle = hexA(p.glow, 0.28)
    ctx.lineWidth = 1.6
    ctx.beginPath(); ctx.arc(0, 0, s, 0, TAU); ctx.stroke()
    ctx.restore()

    // rising mist wisps
    for (let i = 0; i < 3; i++) {
      const wt = ((t * 0.25 + i * 0.7) % 1)
      const wx = x + (i - 1) * s * 0.4 + Math.sin(t * 0.5 + i) * s * 0.06
      const wy = y - s * 0.52 - wt * s * 0.55
      glow(ctx, wx, wy, s * 0.28, p.glow, 0.10 * (1 - wt))
    }
  },

  mound(ctx, x, y, s, p, t) {
    glow(ctx, x, y - s * 0.18, s * 1.45, p.glow, 0.12)
    ctx.save(); ctx.translate(x, y)

    // cast shadow on ground
    ctx.fillStyle = hexA('#000000', 0.14)
    ctx.beginPath(); ctx.ellipse(s * 0.1, s * 0.56, s * 0.88, s * 0.13, 0, 0, TAU); ctx.fill()

    // hill — ambient layer
    const g0 = ctx.createLinearGradient(0, -s, 0, s * 0.56)
    g0.addColorStop(0, shade(p.deep, 14))
    g0.addColorStop(0.55, shade(p.deep, -4))
    g0.addColorStop(1, shade(p.deep, -20))
    ctx.fillStyle = g0
    ctx.beginPath()
    ctx.moveTo(-s * 1.04, s * 0.56)
    ctx.quadraticCurveTo(-s * 0.64, -s * 0.9, 0, -s * 0.87)
    ctx.quadraticCurveTo(s * 0.64, -s * 0.9, s * 1.04, s * 0.56)
    ctx.closePath(); ctx.fill()

    // moonlit summit highlight
    const litG = ctx.createRadialGradient(s * 0.08, -s * 0.62, 0, s * 0.08, -s * 0.28, s * 0.72)
    litG.addColorStop(0, hexA(shade(p.deep, 42), 0.52))
    litG.addColorStop(1, hexA(p.deep, 0))
    ctx.fillStyle = litG
    ctx.beginPath()
    ctx.moveTo(-s * 1.04, s * 0.56)
    ctx.quadraticCurveTo(-s * 0.64, -s * 0.9, 0, -s * 0.87)
    ctx.quadraticCurveTo(s * 0.64, -s * 0.9, s * 1.04, s * 0.56)
    ctx.closePath(); ctx.fill()

    // Newgrange-style spiral engravings
    ctx.save()
    ctx.globalAlpha = 0.20
    ctx.strokeStyle = shade(p.deep, -30)
    ctx.lineWidth = s * 0.02
    ctx.lineCap = 'round'
    for (const [cx, cy, dir] of [[-s * 0.32, -s * 0.2, 1], [s * 0.32, -s * 0.2, -1]]) {
      ctx.beginPath()
      for (let a = 0; a < TAU * 2.2; a += 0.12) {
        const r = s * 0.03 + a * s * 0.014
        const px = cx + dir * Math.cos(a) * r
        const py = cy + Math.sin(a) * r * 0.72
        a < 0.12 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.stroke()
    }
    ctx.restore()

    // doorway lit from within
    const dw = s * 0.17
    const dg = ctx.createLinearGradient(0, -s * 0.12, 0, s * 0.52)
    dg.addColorStop(0, hexA(p.accent, 0.92))
    dg.addColorStop(0.38, hexA(p.accent, 0.52))
    dg.addColorStop(1, hexA(p.glow, 0.04))
    ctx.fillStyle = dg
    ctx.beginPath()
    ctx.moveTo(-dw, s * 0.52)
    ctx.lineTo(-dw, s * 0.06)
    ctx.quadraticCurveTo(-dw, -s * 0.06, 0, -s * 0.06)
    ctx.quadraticCurveTo(dw, -s * 0.06, dw, s * 0.06)
    ctx.lineTo(dw, s * 0.52)
    ctx.closePath(); ctx.fill()

    // stone lintel
    ctx.fillStyle = shade(p.deep, -8)
    ctx.beginPath(); ctx.rect(-dw * 1.4, s * 0.02, dw * 2.8, s * 0.09); ctx.fill()
    ctx.fillStyle = hexA(shade(p.deep, 22), 0.45)
    ctx.beginPath(); ctx.rect(-dw * 1.4, s * 0.02, dw * 2.8, s * 0.026); ctx.fill()

    // threshold pulse
    const pulse = 0.32 + 0.22 * Math.sin(t * 1.3)
    glow(ctx, 0, s * 0.28, s * 0.38, p.accent, pulse * 0.46)
    glow(ctx, 0, s * 0.52, s * 0.55, p.accent, pulse * 0.14)

    ctx.restore()
  },

  stones(ctx, x, y, s, p, t) {
    // moss carpet inside ring
    ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.58)
    const moss = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.7)
    moss.addColorStop(0, hexA('#233428', 0.40))
    moss.addColorStop(1, hexA('#233428', 0))
    ctx.fillStyle = moss
    ctx.beginPath(); ctx.arc(0, 0, s * 0.7, 0, TAU); ctx.fill()
    ctx.restore()

    glow(ctx, x, y, s * 1.2, p.glow, 0.08)

    const n = 9
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU - Math.PI / 2
      const sx = x + Math.cos(a) * s * 0.86
      const sy = y + Math.sin(a) * s * 0.5
      const sw = s * 0.17 + s * 0.045 * Math.sin(i * 3.7)
      const sh = s * 0.28 + s * 0.09 * Math.cos(i * 2.1)
      _stone(ctx, sx, sy, sw, sh, p, a)
    }

    // inner glow
    const pulse = 0.40 + 0.18 * Math.sin(t * 0.82)
    ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.58)
    glow(ctx, 0, 0, s * 0.56, p.glow, pulse * 0.22)
    ctx.restore()

    // flat altar stone at centre
    ctx.save(); ctx.translate(x, y + s * 0.07)
    ctx.fillStyle = shade(p.deep, -10)
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.19, s * 0.08, 0, 0, TAU); ctx.fill()
    ctx.fillStyle = hexA(shade(p.deep, 24), 0.48)
    ctx.beginPath(); ctx.ellipse(0, -s * 0.02, s * 0.19, s * 0.04, 0, 0, TAU); ctx.fill()
    ctx.restore()
  },

  gate(ctx, x, y, s, p, t) {
    glow(ctx, x, y, s * 1.45, p.glow, 0.10)

    // deep mist behind the arch
    for (let layer = 0; layer < 5; layer++) {
      const lx = x + Math.sin(t * 0.38 + layer * 1.1) * s * 0.07
      const ly = y + layer * s * 0.05
      glow(ctx, lx, ly, s * (0.65 + layer * 0.18), p.glow, 0.07 - layer * 0.008)
    }

    // portal shimmer between stones
    const agH = 0.10 + 0.07 * Math.sin(t * 1.15)
    const ag = ctx.createLinearGradient(x, y - s * 0.65, x, y + s * 0.55)
    ag.addColorStop(0, hexA(p.accent, 0))
    ag.addColorStop(0.28, hexA(p.accent, agH * 0.38))
    ag.addColorStop(0.5, hexA(p.accent, agH))
    ag.addColorStop(0.72, hexA(p.accent, agH * 0.38))
    ag.addColorStop(1, hexA(p.accent, 0))
    ctx.fillStyle = ag
    ctx.fillRect(x - s * 0.46, y - s * 0.66, s * 0.92, s * 1.18)

    // stone megaliths
    for (const dir of [-1, 1]) {
      const px = x + dir * s * 0.46
      const litSide = dir > 0  // right stone faces moon
      const sg = ctx.createLinearGradient(px - s * 0.13, 0, px + s * 0.13, 0)
      sg.addColorStop(0, shade(p.deep, litSide ? 22 : -12))
      sg.addColorStop(0.5, shade(p.deep, litSide ? 8 : -6))
      sg.addColorStop(1, shade(p.deep, litSide ? -6 : -24))
      ctx.fillStyle = sg
      ctx.beginPath()
      ctx.moveTo(px - s * 0.115, y + s * 0.58)
      ctx.lineTo(px - s * 0.095, y - s * 0.60)
      ctx.quadraticCurveTo(px, y - s * 0.66, px + s * 0.095, y - s * 0.60)
      ctx.lineTo(px + s * 0.115, y + s * 0.58)
      ctx.closePath(); ctx.fill()

      // lit edge
      if (litSide) {
        ctx.fillStyle = hexA(p.glow, 0.18)
        ctx.beginPath()
        ctx.moveTo(px + s * 0.08, y + s * 0.58)
        ctx.lineTo(px + s * 0.095, y - s * 0.60)
        ctx.lineTo(px + s * 0.115, y - s * 0.52)
        ctx.lineTo(px + s * 0.115, y + s * 0.58)
        ctx.closePath(); ctx.fill()
      }

      // fog wisps around each stone
      for (let i = 0; i < 3; i++) {
        const wy = y + s * 0.32 - i * s * 0.3
        const sway = Math.sin(t * 0.55 + i * 1.6 + dir) * s * 0.09
        ctx.fillStyle = hexA(p.glow, 0.08 - i * 0.018)
        ctx.beginPath()
        ctx.ellipse(px + sway, wy, s * 0.30, s * 0.17, 0, 0, TAU)
        ctx.fill()
      }
    }

    // lintel
    ctx.fillStyle = shade(p.deep, -5)
    ctx.beginPath(); ctx.rect(x - s * 0.58, y - s * 0.62, s * 1.16, s * 0.10); ctx.fill()
    ctx.fillStyle = hexA(shade(p.deep, 20), 0.38)
    ctx.beginPath(); ctx.rect(x - s * 0.58, y - s * 0.62, s * 1.16, s * 0.03); ctx.fill()
  },

  kelp(ctx, x, y, s, p, t) {
    glow(ctx, x, y, s * 1.35, p.glow, 0.14)

    // seafloor base
    const floor = ctx.createRadialGradient(x, y + s * 0.54, 0, x, y + s * 0.54, s * 0.72)
    floor.addColorStop(0, hexA(p.deep, 0.72))
    floor.addColorStop(1, hexA(p.deep, 0))
    ctx.fillStyle = floor
    ctx.beginPath(); ctx.ellipse(x, y + s * 0.54, s * 0.72, s * 0.22, 0, 0, TAU); ctx.fill()

    const strands = 8
    for (let i = 0; i < strands; i++) {
      const bx = x + (i - strands / 2 + 0.5) * s * 0.21
      const h = s * (0.88 + 0.28 * Math.sin(i * 1.9 + 0.5))
      const thick = s * 0.042 + s * 0.016 * Math.sin(i * 2.8)
      const phase = i * 0.92 + 0.4
      const front = (i % 3 !== 1)  // most strands in front

      ctx.strokeStyle = hexA(p.glow, front ? 0.48 : 0.28)
      ctx.lineWidth = thick
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'

      // build main strand path
      const pts = []
      const segs = 7
      for (let j = 0; j <= segs; j++) {
        const frac = j / segs
        const sway = Math.sin(t * 1.05 + phase + j * 0.52) * s * 0.13 * frac
        pts.push([bx + sway, y + s * 0.54 - h * frac])
      }
      ctx.beginPath()
      pts.forEach(([px, py], j) => j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py))
      ctx.stroke()

      // side fronds branching from every 2nd segment
      ctx.lineWidth = thick * 0.46
      ctx.strokeStyle = hexA(p.glow, front ? 0.32 : 0.18)
      for (let j = 2; j <= segs; j += 2) {
        const [px, py] = pts[j]
        const fl = h * 0.17 * (j / segs)
        for (const dir of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(px, py)
          ctx.quadraticCurveTo(
            px + dir * fl * 0.7 + Math.sin(t * 1.5 + j + i) * fl * 0.22,
            py - fl * 0.5,
            px + dir * fl, py - fl * 0.82
          )
          ctx.stroke()
        }
      }

      // bioluminescent dots
      for (let j = 1; j <= segs; j++) {
        const [dx, dy] = pts[j]
        const pulse = 0.5 + 0.5 * Math.sin(t * 2.2 + phase + j * 0.9)
        if (pulse > 0.68) {
          ctx.fillStyle = hexA(p.accent, 0.75 * ((pulse - 0.68) / 0.32))
          ctx.beginPath(); ctx.arc(dx, dy, s * 0.022, 0, TAU); ctx.fill()
        }
      }

      // glowing tip
      const [tipx, tipy] = pts[pts.length - 1]
      glow(ctx, tipx, tipy, s * 0.20, p.accent, front ? 0.58 : 0.32)
    }

    // rising bubbles
    for (let i = 0; i < 6; i++) {
      const bp = ((t * 0.28 + i * 0.55) % 1)
      const bx = x + (i - 2.5) * s * 0.26 + Math.sin(t * 0.9 + i) * s * 0.07
      const by = y + s * 0.52 - bp * s * 1.35
      const ba = bp < 0.82 ? 0.14 : 0.14 * (1 - (bp - 0.82) / 0.18)
      ctx.strokeStyle = hexA(p.glow, ba)
      ctx.lineWidth = 0.9
      ctx.beginPath(); ctx.arc(bx, by, s * 0.024, 0, TAU); ctx.stroke()
    }
  }
}

function _stone(ctx, x, y, w, h, p, angle) {
  ctx.save(); ctx.translate(x, y)
  // directional lighting: moon is upper-right
  const facing = (Math.cos(angle + Math.PI / 4) + 1) / 2
  const g = ctx.createLinearGradient(-w, -h, w, h)
  g.addColorStop(0, shade(p.deep, 10 + facing * 26))
  g.addColorStop(0.45, shade(p.deep, facing * 10))
  g.addColorStop(1, shade(p.deep, -12))
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.moveTo(-w * 0.5, h)
  ctx.lineTo(-w * 0.44, -h * 0.76)
  ctx.quadraticCurveTo(0, -h, w * 0.4, -h * 0.78)
  ctx.lineTo(w * 0.5, h)
  ctx.closePath(); ctx.fill()

  // moon-lit face edge
  if (facing > 0.48) {
    ctx.fillStyle = hexA(p.glow, (facing - 0.48) * 0.32)
    ctx.beginPath()
    ctx.moveTo(w * 0.3, h); ctx.lineTo(w * 0.4, -h * 0.78)
    ctx.quadraticCurveTo(w * 0.48, -h * 0.5, w * 0.5, h)
    ctx.closePath(); ctx.fill()
  }

  // lichen patches
  ctx.globalAlpha = 0.20
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#7a8a60' : '#4e6038'
    const lx = Math.sin(i * 2.4) * w * 0.28
    const ly = Math.cos(i * 1.8) * h * 0.44
    ctx.beginPath(); ctx.ellipse(lx, ly, w * 0.19, w * 0.11, i * 0.8, 0, TAU); ctx.fill()
  }
  ctx.globalAlpha = 1

  // ground shadow
  ctx.fillStyle = hexA('#000000', 0.16)
  ctx.beginPath(); ctx.ellipse(0, h * 0.88, w * 0.58, h * 0.09, 0, 0, TAU); ctx.fill()
  ctx.restore()
}

/* ── creatures ─────────────────────────────────────────────────────────── */

export const CREATURE = {

  selkie(ctx, x, y, s, p, t, mood) {
    const bob = Math.sin(t * 1.35) * s * 0.05
    glow(ctx, x, y + bob, s * 1.55, p.glow, 0.38)
    ctx.save(); ctx.translate(x, y + bob)

    // main seal body — two-tone gradient (dark dorsal, pale ventral)
    const g = ctx.createLinearGradient(-s * 0.3, -s * 0.65, s * 0.22, s * 0.62)
    g.addColorStop(0, shade(p.body, 28))
    g.addColorStop(0.42, p.body)
    g.addColorStop(1, shade(p.body, -18))
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.ellipse(0, s * 0.08, s * 0.40, s * 0.65, 0, 0, TAU)
    ctx.fill()

    // belly highlight — paler underside
    const bg = ctx.createRadialGradient(s * 0.06, s * 0.18, 0, s * 0.06, s * 0.18, s * 0.38)
    bg.addColorStop(0, hexA('#d8eaf4', 0.30))
    bg.addColorStop(1, hexA('#d8eaf4', 0))
    ctx.fillStyle = bg
    ctx.beginPath(); ctx.ellipse(s * 0.06, s * 0.2, s * 0.24, s * 0.42, 0, 0, TAU); ctx.fill()

    // head
    const hg = ctx.createRadialGradient(-s * 0.04, -s * 0.5, 0, -s * 0.04, -s * 0.5, s * 0.3)
    hg.addColorStop(0, shade(p.body, 24)); hg.addColorStop(1, p.body)
    ctx.fillStyle = hg
    ctx.beginPath(); ctx.ellipse(0, -s * 0.5, s * 0.28, s * 0.28, 0, 0, TAU); ctx.fill()

    // muzzle
    ctx.fillStyle = shade(p.body, 20)
    ctx.beginPath(); ctx.ellipse(s * 0.08, -s * 0.44, s * 0.14, s * 0.10, 0.2, 0, TAU); ctx.fill()

    // sheen highlight
    ctx.fillStyle = hexA('#ffffff', 0.24)
    ctx.beginPath(); ctx.ellipse(-s * 0.10, -s * 0.56, s * 0.09, s * 0.13, 0.4, 0, TAU); ctx.fill()

    // whiskers
    ctx.strokeStyle = hexA('#c8dae8', 0.55)
    ctx.lineWidth = 0.7
    for (const [wx, wy, wa] of [
      [s * 0.06, -s * 0.44, 0.2], [s * 0.06, -s * 0.42, -0.1], [s * 0.06, -s * 0.46, 0.5]
    ]) {
      ctx.beginPath()
      ctx.moveTo(wx, wy)
      ctx.lineTo(wx + s * 0.22 * Math.cos(wa), wy + s * 0.06 * Math.sin(wa))
      ctx.stroke()
    }

    // hind flippers
    ctx.fillStyle = shade(p.body, -12)
    for (const d of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(d * s * 0.22, s * 0.58)
      ctx.quadraticCurveTo(d * s * 0.44, s * 0.72, d * s * 0.28, s * 0.78)
      ctx.quadraticCurveTo(d * s * 0.10, s * 0.76, 0, s * 0.65)
      ctx.closePath(); ctx.fill()
    }

    // eyes — dark with catch-light
    for (const d of [-1, 1]) {
      ctx.fillStyle = '#0e161e'
      ctx.beginPath(); ctx.arc(d * s * 0.10, -s * 0.52, s * 0.065, 0, TAU); ctx.fill()
      ctx.fillStyle = hexA('#ffffff', 0.6)
      ctx.beginPath(); ctx.arc(d * s * 0.10 + s * 0.025, -s * 0.53, s * 0.024, 0, TAU); ctx.fill()
    }

    ctx.restore()
  },

  puca(ctx, x, y, s, p, t, mood) {
    const bob = Math.sin(t * 2.0) * s * 0.055
    glow(ctx, x, y + bob, s * 1.5, p.glow, 0.28)
    ctx.save(); ctx.translate(x, y + bob)

    // body — dark shapeshifter silhouette
    const g = ctx.createLinearGradient(0, -s * 0.8, 0, s * 0.55)
    g.addColorStop(0, shade(p.body, 16))
    g.addColorStop(0.5, p.body)
    g.addColorStop(1, shade(p.body, -10))
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(-s * 0.52, s * 0.52)
    ctx.quadraticCurveTo(-s * 0.58, -s * 0.18, -s * 0.2, -s * 0.38)
    ctx.quadraticCurveTo(-s * 0.06, -s * 0.78, s * 0.22, -s * 0.74)
    ctx.quadraticCurveTo(s * 0.44, -s * 0.64, s * 0.42, -s * 0.44)
    ctx.quadraticCurveTo(s * 0.22, -s * 0.32, s * 0.52, s * 0.02)
    ctx.quadraticCurveTo(s * 0.58, s * 0.42, s * 0.42, s * 0.52)
    ctx.closePath(); ctx.fill()

    // leg hints
    ctx.fillStyle = shade(p.body, -14)
    for (const [lx, la] of [[-s * 0.3, -0.1], [-s * 0.1, 0.05], [s * 0.15, -0.05], [s * 0.36, 0.08]]) {
      ctx.beginPath()
      ctx.moveTo(lx, s * 0.52)
      ctx.lineTo(lx + Math.sin(la) * s * 0.06, s * 0.72)
      ctx.lineTo(lx + Math.sin(la) * s * 0.06 + s * 0.09, s * 0.72)
      ctx.lineTo(lx + s * 0.08, s * 0.52)
      ctx.closePath(); ctx.fill()
    }

    // wind-blown mane
    const manePhase = Math.sin(t * 1.8) * 0.06
    ctx.strokeStyle = hexA(shade(p.body, 20), 0.65)
    ctx.lineWidth = s * 0.04
    ctx.lineCap = 'round'
    for (let i = 0; i < 6; i++) {
      const mx = s * 0.1 - i * s * 0.06
      const my = -s * 0.6 + i * s * 0.06
      ctx.beginPath(); ctx.moveTo(mx, my)
      ctx.quadraticCurveTo(
        mx - s * 0.25 + manePhase * s * (i + 1),
        my - s * 0.15,
        mx - s * (0.36 + i * 0.04),
        my - s * 0.08 + Math.sin(t + i) * s * 0.04
      )
      ctx.stroke()
    }

    // tail
    ctx.strokeStyle = hexA(shade(p.body, 18), 0.55)
    ctx.lineWidth = s * 0.035
    ctx.beginPath()
    ctx.moveTo(s * 0.42, s * 0.52)
    ctx.quadraticCurveTo(
      s * 0.68 + Math.sin(t * 2.2) * s * 0.08, s * 0.2,
      s * 0.58 + Math.sin(t * 1.6) * s * 0.1, -s * 0.08
    )
    ctx.stroke()

    // ear
    ctx.fillStyle = shade(p.body, 8)
    ctx.beginPath()
    ctx.moveTo(s * 0.04, -s * 0.70)
    ctx.lineTo(s * 0.00, -s * 0.98 - Math.abs(Math.sin(t * 2.8)) * s * 0.06)
    ctx.lineTo(s * 0.16, -s * 0.74)
    ctx.closePath(); ctx.fill()

    // ember eyes (two)
    for (const [ex, ey] of [[s * 0.24, -s * 0.58], [s * 0.32, -s * 0.54]]) {
      glow(ctx, ex, ey, s * 0.16, p.glow, 0.85)
      ctx.fillStyle = p.trim
      ctx.beginPath(); ctx.arc(ex, ey, s * 0.058, 0, TAU); ctx.fill()
      ctx.fillStyle = hexA('#ffffff', 0.5)
      ctx.beginPath(); ctx.arc(ex + s * 0.02, ey - s * 0.02, s * 0.018, 0, TAU); ctx.fill()
    }

    ctx.restore()
  },

  merrow(ctx, x, y, s, p, t, mood) {
    const bob = Math.sin(t * 1.3) * s * 0.05
    glow(ctx, x, y + bob, s * 1.5, p.glow, 0.38)
    ctx.save(); ctx.translate(x, y + bob)

    // tail flick
    const flick = Math.sin(t * 2.2) * s * 0.24
    const g = ctx.createLinearGradient(0, -s * 0.58, 0, s * 0.88)
    g.addColorStop(0, shade(p.body, 28))
    g.addColorStop(0.5, p.body)
    g.addColorStop(1, shade(p.body, -26))
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(0, -s * 0.58)
    ctx.quadraticCurveTo(s * 0.3, -s * 0.22, s * 0.16, s * 0.3)
    ctx.quadraticCurveTo(s * 0.06, s * 0.62, flick, s * 0.84)
    ctx.quadraticCurveTo(flick + s * 0.2, s * 0.72, flick - s * 0.04, s * 0.56)
    ctx.quadraticCurveTo(-s * 0.22, s * 0.22, -s * 0.18, -s * 0.22)
    ctx.quadraticCurveTo(-s * 0.26, -s * 0.52, 0, -s * 0.58)
    ctx.closePath(); ctx.fill()

    // scale texture hint — overlapping ellipses on lower half
    ctx.save()
    ctx.globalAlpha = 0.16
    ctx.fillStyle = shade(p.body, -20)
    for (let row = 0; row < 4; row++) {
      for (let col = -1; col <= 1; col++) {
        const sy2 = s * 0.14 + row * s * 0.14
        const sx2 = col * s * 0.10 + (row % 2) * s * 0.05
        ctx.beginPath(); ctx.ellipse(sx2, sy2, s * 0.09, s * 0.065, 0, 0, TAU); ctx.fill()
      }
    }
    ctx.restore()

    // tail fin — forked
    const tg = ctx.createLinearGradient(flick - s * 0.15, s * 0.7, flick + s * 0.28, s * 1.02)
    tg.addColorStop(0, shade(p.body, 18)); tg.addColorStop(1, shade(p.body, -30))
    ctx.fillStyle = tg
    for (const d of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(flick, s * 0.76)
      ctx.quadraticCurveTo(flick + d * s * 0.22, s * 0.86, flick + d * s * 0.32, s * 1.04)
      ctx.quadraticCurveTo(flick + d * s * 0.16, s * 0.98, flick, s * 0.84)
      ctx.closePath(); ctx.fill()
    }

    // head
    ctx.fillStyle = shade(p.body, 30)
    ctx.beginPath(); ctx.arc(0, -s * 0.64, s * 0.24, 0, TAU); ctx.fill()

    // flowing hair
    ctx.strokeStyle = hexA(shade(p.body, 40), 0.55)
    ctx.lineWidth = s * 0.055
    ctx.lineCap = 'round'
    for (let i = 0; i < 4; i++) {
      const hx = -s * 0.1 - i * s * 0.04
      const hy = -s * 0.55
      ctx.beginPath(); ctx.moveTo(hx, hy)
      ctx.quadraticCurveTo(
        hx - s * 0.18 + Math.sin(t * 0.9 + i) * s * 0.06,
        hy + s * 0.28,
        hx - s * 0.08 + Math.sin(t * 0.7 + i) * s * 0.08,
        hy + s * 0.54
      )
      ctx.stroke()
    }

    // red cohuleen druith cap
    ctx.fillStyle = p.trim
    ctx.beginPath()
    ctx.ellipse(0, -s * 0.80, s * 0.27, s * 0.16, 0, Math.PI, TAU)
    ctx.fill()
    // cap feather
    ctx.strokeStyle = hexA(p.trim, 0.7)
    ctx.lineWidth = s * 0.028
    ctx.beginPath()
    ctx.moveTo(s * 0.1, -s * 0.82)
    ctx.quadraticCurveTo(s * 0.28, -s * 1.02, s * 0.18, -s * 1.08)
    ctx.stroke()

    eyes(ctx, 0, -s * 0.62, s * 0.09, '#0e1f26', 0.95)
    ctx.restore()
  },

  faerie(ctx, x, y, s, p, t, mood) {
    const bob = Math.sin(t * 1.8) * s * 0.08
    glow(ctx, x, y + bob, s * 1.7, p.glow, 0.42)
    ctx.save(); ctx.translate(x, y + bob)

    // rear wing pair (larger, behind body)
    const wf = 0.55 + 0.30 * Math.abs(Math.sin(t * 5.2))
    ctx.fillStyle = hexA(p.trim, 0.28)
    for (const d of [-1, 1]) {
      ctx.save(); ctx.scale(d, 1)
      ctx.beginPath()
      ctx.moveTo(s * 0.06, -s * 0.08)
      ctx.quadraticCurveTo(s * 0.48 * wf, -s * 0.54, s * 0.44 * wf, -s * 0.12)
      ctx.quadraticCurveTo(s * 0.38 * wf, s * 0.18, s * 0.10, s * 0.06)
      ctx.closePath(); ctx.fill()
      ctx.restore()
    }
    // front wing pair (smaller, in front)
    ctx.fillStyle = hexA(p.trim, 0.38)
    for (const d of [-1, 1]) {
      ctx.save(); ctx.scale(d, 1)
      ctx.beginPath()
      ctx.moveTo(s * 0.05, 0)
      ctx.quadraticCurveTo(s * 0.36 * wf, -s * 0.32, s * 0.30 * wf, s * 0.04)
      ctx.quadraticCurveTo(s * 0.24 * wf, s * 0.22, s * 0.08, s * 0.08)
      ctx.closePath(); ctx.fill()
      ctx.restore()
    }

    // wing sheen
    ctx.strokeStyle = hexA(p.trim, 0.40)
    ctx.lineWidth = 0.6
    for (const d of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(s * 0.06, -s * 0.08)
      ctx.quadraticCurveTo(d * s * 0.44 * wf, -s * 0.50, d * s * 0.42 * wf, -s * 0.10)
      ctx.stroke()
    }

    // slender body
    const bg = ctx.createLinearGradient(0, -s * 0.58, 0, s * 0.52)
    bg.addColorStop(0, shade(p.body, 30)); bg.addColorStop(1, shade(p.body, -12))
    ctx.fillStyle = bg
    ctx.beginPath()
    ctx.moveTo(0, -s * 0.57)
    ctx.quadraticCurveTo(s * 0.15, -s * 0.1, s * 0.055, s * 0.46)
    ctx.quadraticCurveTo(0, s * 0.56, -s * 0.055, s * 0.46)
    ctx.quadraticCurveTo(-s * 0.15, -s * 0.1, 0, -s * 0.57)
    ctx.closePath(); ctx.fill()

    // head
    ctx.beginPath(); ctx.arc(0, -s * 0.62, s * 0.18, 0, TAU); ctx.fill()

    // tiny star crown
    ctx.fillStyle = hexA(p.glow, 0.9)
    for (let i = 0; i < 5; i++) {
      const ca = (i / 5) * TAU - Math.PI / 2
      ctx.beginPath(); ctx.arc(
        Math.cos(ca) * s * 0.18, -s * 0.62 + Math.sin(ca) * s * 0.18,
        s * 0.022, 0, TAU
      ); ctx.fill()
    }

    // head glow
    glow(ctx, 0, -s * 0.62, s * 0.32, p.glow, 0.38)

    // sparkle trail (orbiting particles)
    for (let i = 0; i < 5; i++) {
      const sa = t * 2.2 + (i / 5) * TAU
      const sr = s * (0.55 + 0.2 * Math.sin(t + i))
      const sx = Math.cos(sa) * sr, sy = Math.sin(sa) * sr * 0.5
      const sp = 0.4 + 0.6 * Math.abs(Math.sin(t * 3 + i))
      ctx.fillStyle = hexA(p.glow, 0.65 * sp)
      ctx.beginPath(); ctx.arc(sx, sy - s * 0.1, s * 0.024 * sp, 0, TAU); ctx.fill()
    }

    ctx.restore()
  },

  wisp(ctx, x, y, s, p, t, mood) {
    const flick = 0.78 + 0.28 * Math.sin(t * 6.8) + 0.14 * Math.sin(t * 13.2)

    // strong outer aura — three nested rings
    glow(ctx, x, y, s * 2.8 * flick, p.glow, 0.22)
    glow(ctx, x, y, s * 1.9 * flick, p.glow, 0.38)
    glow(ctx, x, y, s * 1.1 * flick, p.glow, 0.55)

    // trailing tail — organic teardrop
    ctx.fillStyle = hexA(p.body, 0.48)
    ctx.beginPath()
    ctx.moveTo(x, y - s * 0.08)
    ctx.quadraticCurveTo(x - s * 0.14, y + s * 0.48, x, y + s * 0.78)
    ctx.quadraticCurveTo(x + s * 0.14, y + s * 0.48, x, y - s * 0.08)
    ctx.closePath(); ctx.fill()

    // core gradient orb — bright
    const g = ctx.createRadialGradient(x, y, 0, x, y, s * 0.58)
    g.addColorStop(0, '#ffffff')
    g.addColorStop(0.18, hexA(p.trim, 0.98))
    g.addColorStop(0.45, hexA(p.glow, 0.72))
    g.addColorStop(0.75, hexA(p.body, 0.40))
    g.addColorStop(1, hexA(p.body, 0))
    ctx.fillStyle = g
    ctx.beginPath(); ctx.arc(x, y, s * 0.58 * flick, 0, TAU); ctx.fill()

    // hot white core
    ctx.fillStyle = hexA('#ffffff', 0.95 * flick)
    ctx.beginPath(); ctx.arc(x, y, s * 0.18 * flick, 0, TAU); ctx.fill()

    // cute face — tiny dots and smile on the orb
    const faceAlpha = 0.55 + 0.35 * Math.sin(t * 1.2)
    ctx.fillStyle = hexA('#1a2830', faceAlpha)
    for (const ex of [-s * 0.12, s * 0.12]) {
      ctx.beginPath(); ctx.arc(x + ex, y - s * 0.06, s * 0.048, 0, TAU); ctx.fill()
    }
    ctx.strokeStyle = hexA('#1a2830', faceAlpha * 0.75)
    ctx.lineWidth = s * 0.035; ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(x, y + s * 0.06, s * 0.10, 0.1, Math.PI - 0.1)
    ctx.stroke()

    // corona sparks — brighter
    for (let i = 0; i < 8; i++) {
      const sa = t * 3.2 + (i / 8) * TAU
      const sr = s * (0.42 + 0.22 * Math.sin(t * 4 + i * 1.2)) * flick
      const sp = 0.5 + 0.5 * Math.sin(t * 5 + i * 0.9)
      ctx.fillStyle = hexA(p.trim, 0.82 * sp)
      ctx.beginPath()
      ctx.arc(x + Math.cos(sa) * sr, y + Math.sin(sa) * sr * 0.62, s * 0.032 * sp, 0, TAU)
      ctx.fill()
    }
  },

  kelpie(ctx, x, y, s, p, t, mood) {
    const emerge = Math.sin(t * 1.05) * s * 0.04
    // Strong teal glow — three layers
    glow(ctx, x, y + emerge, s * 2.0, p.glow, 0.18)
    glow(ctx, x, y + emerge, s * 1.2, p.glow, 0.30)
    glow(ctx, x, y + emerge, s * 0.65, p.glow, 0.45)

    ctx.save(); ctx.translate(x, y + emerge)

    // Water dissolve at base — kelpie emerges from below
    const waterG = ctx.createLinearGradient(0, s * 0.22, 0, s * 0.78)
    waterG.addColorStop(0, hexA(p.glow, 0))
    waterG.addColorStop(0.5, hexA(p.glow, 0.12))
    waterG.addColorStop(1, hexA(p.glow, 0.25))
    ctx.fillStyle = waterG
    ctx.beginPath(); ctx.ellipse(0, s * 0.60, s * 0.62, s * 0.28, 0, 0, TAU); ctx.fill()

    // Neck and chest — horse silhouette
    const bodyG = ctx.createLinearGradient(0, -s * 0.62, 0, s * 0.55)
    bodyG.addColorStop(0, shade(p.body, 14))
    bodyG.addColorStop(0.5, p.body)
    bodyG.addColorStop(1, shade(p.body, -8))
    ctx.fillStyle = bodyG
    ctx.beginPath()
    ctx.moveTo(-s * 0.26, s * 0.50)
    ctx.bezierCurveTo(-s * 0.24, s * 0.08, -s * 0.20, -s * 0.28, s * 0.04, -s * 0.58)
    ctx.bezierCurveTo(s * 0.22, -s * 0.72, s * 0.40, -s * 0.66, s * 0.44, -s * 0.50)
    ctx.bezierCurveTo(s * 0.50, -s * 0.30, s * 0.42, -s * 0.08, s * 0.34, s * 0.50)
    ctx.closePath(); ctx.fill()

    // Head — elongated horse profile
    ctx.fillStyle = shade(p.body, 12)
    ctx.beginPath()
    ctx.moveTo(s * 0.04, -s * 0.58)
    ctx.bezierCurveTo(s * 0.18, -s * 0.70, s * 0.46, -s * 0.82, s * 0.62, -s * 0.72)
    ctx.bezierCurveTo(s * 0.74, -s * 0.62, s * 0.70, -s * 0.50, s * 0.56, -s * 0.46)
    ctx.bezierCurveTo(s * 0.44, -s * 0.42, s * 0.28, -s * 0.48, s * 0.20, -s * 0.52)
    ctx.bezierCurveTo(s * 0.10, -s * 0.56, s * 0.04, -s * 0.58, s * 0.04, -s * 0.58)
    ctx.closePath(); ctx.fill()

    // Mane — dripping seaweed-like strands
    const maneWave = Math.sin(t * 0.95) * 0.05
    ctx.lineCap = 'round'
    for (let mi = 0; mi < 7; mi++) {
      const mx = s * (0.08 - mi * 0.038)
      const my = s * (-0.52 + mi * 0.072)
      const tipX = mx - s * (0.26 + mi * 0.038) + maneWave * s * (mi + 1) * 0.06
      const tipY = my + s * (0.28 + mi * 0.08) + Math.sin(t * 1.2 + mi) * s * 0.04
      // Dark strand
      ctx.strokeStyle = hexA(shade(p.body, -8), 0.60)
      ctx.lineWidth = s * 0.030
      ctx.beginPath(); ctx.moveTo(mx, my)
      ctx.quadraticCurveTo(mx - s * 0.14, my + s * 0.15, tipX, tipY)
      ctx.stroke()
      // Glowing highlight
      ctx.strokeStyle = hexA(p.glow, 0.50)
      ctx.lineWidth = s * 0.016
      ctx.beginPath(); ctx.moveTo(mx, my)
      ctx.quadraticCurveTo(mx - s * 0.14, my + s * 0.15, tipX, tipY)
      ctx.stroke()
      // Glowing tip
      const tipPulse = 0.50 + 0.50 * Math.sin(t * 1.8 + mi * 0.7)
      ctx.fillStyle = hexA(p.trim, tipPulse * 0.72)
      ctx.beginPath(); ctx.arc(tipX, tipY, s * 0.016, 0, TAU); ctx.fill()
    }

    // Eyes — glowing blue-teal
    const eyePulse = 0.72 + 0.28 * Math.sin(t * 1.4)
    for (const [ex, ey] of [[s * 0.58, -s * 0.66], [s * 0.45, -s * 0.68]]) {
      glow(ctx, ex, ey, s * 0.18, p.glow, 0.90 * eyePulse)
      ctx.fillStyle = p.trim
      ctx.beginPath(); ctx.arc(ex, ey, s * 0.042, 0, TAU); ctx.fill()
      ctx.fillStyle = hexA('#000000', 0.82)
      ctx.beginPath(); ctx.arc(ex, ey, s * 0.024, 0, TAU); ctx.fill()
      ctx.fillStyle = hexA('#ffffff', 0.58)
      ctx.beginPath(); ctx.arc(ex + s * 0.013, ey - s * 0.013, s * 0.012, 0, TAU); ctx.fill()
    }

    // Base glow — water surface
    glow(ctx, 0, s * 0.52, s * 0.48, p.glow, 0.32)

    ctx.restore()
  },

  raven(ctx, x, y, s, p, t, mood) {
    const bob = Math.sin(t * 0.75) * s * 0.030  // subtle perched breathing

    // Purple-blue glow aura
    glow(ctx, x, y + bob - s * 0.22, s * 1.9, p.glow, 0.16)
    glow(ctx, x, y + bob - s * 0.22, s * 1.1, p.glow, 0.28)

    ctx.save(); ctx.translate(x, y + bob)

    // Wing spread — partially open (resting alert posture)
    const wingFlap = Math.sin(t * 0.58) * s * 0.022
    for (const dir of [-1, 1]) {
      ctx.save(); ctx.scale(dir, 1)

      // Main wing plane
      ctx.fillStyle = shade(p.body, 6)
      ctx.beginPath()
      ctx.moveTo(s * 0.06, s * 0.06)
      ctx.quadraticCurveTo(s * 0.42, -s * 0.16 + wingFlap, s * 0.74, s * 0.18)
      ctx.quadraticCurveTo(s * 0.55, s * 0.36, s * 0.22, s * 0.28)
      ctx.quadraticCurveTo(s * 0.10, s * 0.16, s * 0.06, s * 0.06)
      ctx.closePath(); ctx.fill()

      // Iridescent wing sheen
      ctx.fillStyle = hexA(p.trim, 0.12)
      ctx.beginPath()
      ctx.moveTo(s * 0.10, s * 0.08)
      ctx.quadraticCurveTo(s * 0.36, -s * 0.10 + wingFlap, s * 0.62, s * 0.18)
      ctx.quadraticCurveTo(s * 0.48, s * 0.30, s * 0.20, s * 0.24)
      ctx.closePath(); ctx.fill()

      // Feather tip separations
      ctx.strokeStyle = hexA(shade(p.body, -12), 0.38)
      ctx.lineWidth = s * 0.014; ctx.lineCap = 'round'
      for (let fi = 0; fi < 5; fi++) {
        const ft = fi / 4
        const fx = s * (0.20 + ft * 0.54)
        const fy = s * 0.20 + ft * s * 0.06
        ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + s * 0.06, fy + s * 0.12); ctx.stroke()
      }

      // Glowing rune on wing — pulsing
      const runeX = s * 0.40, runeY = s * 0.14
      const runePulse = 0.45 + 0.55 * Math.sin(t * 1.5 + dir * 1.2)
      glow(ctx, runeX, runeY, s * 0.16, p.glow, 0.65 * runePulse)
      ctx.strokeStyle = hexA(p.glow, 0.70 * runePulse)
      ctx.lineWidth = s * 0.022; ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(runeX - s * 0.07, runeY - s * 0.07); ctx.lineTo(runeX + s * 0.07, runeY + s * 0.07)
      ctx.moveTo(runeX + s * 0.07, runeY - s * 0.07); ctx.lineTo(runeX - s * 0.07, runeY + s * 0.07)
      ctx.stroke()
      ctx.beginPath(); ctx.arc(runeX, runeY, s * 0.09, 0, TAU); ctx.stroke()

      ctx.restore()
    }

    // Body — dark ovoid
    ctx.fillStyle = p.body
    ctx.beginPath(); ctx.ellipse(0, s * 0.08, s * 0.28, s * 0.42, 0, 0, TAU); ctx.fill()

    // Head
    ctx.beginPath(); ctx.arc(s * 0.06, -s * 0.32, s * 0.22, 0, TAU); ctx.fill()

    // Beak — sharp corvid
    ctx.fillStyle = '#201c14'
    ctx.beginPath()
    ctx.moveTo(s * 0.22, -s * 0.36)
    ctx.lineTo(s * 0.48, -s * 0.32)
    ctx.lineTo(s * 0.20, -s * 0.27)
    ctx.closePath(); ctx.fill()

    // Eye — bright gold with catch-light
    glow(ctx, s * 0.17, -s * 0.36, s * 0.10, '#d4a820', 0.65)
    ctx.fillStyle = '#c89818'
    ctx.beginPath(); ctx.arc(s * 0.17, -s * 0.36, s * 0.052, 0, TAU); ctx.fill()
    ctx.fillStyle = '#0a0806'
    ctx.beginPath(); ctx.arc(s * 0.17, -s * 0.36, s * 0.030, 0, TAU); ctx.fill()
    ctx.fillStyle = hexA('#ffffff', 0.62)
    ctx.beginPath(); ctx.arc(s * 0.18, -s * 0.375, s * 0.014, 0, TAU); ctx.fill()

    // Purple-blue iridescent sheen on body
    ctx.fillStyle = hexA(p.trim, 0.15)
    ctx.beginPath(); ctx.ellipse(-s * 0.04, -s * 0.04, s * 0.14, s * 0.30, 0.2, 0, TAU); ctx.fill()

    // Tail feathers — forked
    for (const [tx, ta] of [[-s * 0.18, -0.12], [0, 0], [s * 0.08, 0.10]]) {
      ctx.fillStyle = shade(p.body, 8)
      ctx.beginPath()
      ctx.moveTo(tx, s * 0.42)
      ctx.quadraticCurveTo(tx - s * 0.10, s * 0.66, tx - s * 0.04 + Math.cos(ta) * s * 0.08, s * 0.74)
      ctx.quadraticCurveTo(tx + s * 0.04, s * 0.68, tx + s * 0.06, s * 0.42)
      ctx.closePath(); ctx.fill()
    }

    // Foot glow — perched on something ancient
    glow(ctx, 0, s * 0.52, s * 0.38, p.glow, 0.20)

    ctx.restore()
  }
}

/* ── story icons ───────────────────────────────────────────────────────── */

export const FIGURE = {
  crown(ctx, x, y, s, p) { base(ctx, x, y, s, p); ctx.fillStyle = p.glow
    ctx.beginPath(); ctx.moveTo(x - s * 0.4, y + s * 0.1); ctx.lineTo(x - s * 0.4, y - s * 0.2)
    ctx.lineTo(x - s * 0.15, y + s * 0.02); ctx.lineTo(x, y - s * 0.3); ctx.lineTo(x + s * 0.15, y + s * 0.02)
    ctx.lineTo(x + s * 0.4, y - s * 0.2); ctx.lineTo(x + s * 0.4, y + s * 0.1); ctx.closePath(); ctx.fill() },
  shield(ctx, x, y, s, p) { base(ctx, x, y, s, p); ctx.fillStyle = p.glow
    ctx.beginPath(); ctx.moveTo(x, y - s * 0.32); ctx.lineTo(x + s * 0.3, y - s * 0.2)
    ctx.lineTo(x + s * 0.22, y + s * 0.22); ctx.lineTo(x, y + s * 0.36); ctx.lineTo(x - s * 0.22, y + s * 0.22)
    ctx.lineTo(x - s * 0.3, y - s * 0.2); ctx.closePath(); ctx.fill() },
  'bull-white'(ctx, x, y, s, p) { bull(ctx, x, y, s, p, '#f2ecdc') },
  'bull-brown'(ctx, x, y, s, p) { bull(ctx, x, y, s, p, p.glow) },
  house(ctx, x, y, s, p) { base(ctx, x, y, s, p); ctx.fillStyle = p.glow
    ctx.beginPath(); ctx.moveTo(x - s * 0.3, y + s * 0.3); ctx.lineTo(x - s * 0.3, y - s * 0.05)
    ctx.lineTo(x, y - s * 0.32); ctx.lineTo(x + s * 0.3, y - s * 0.05); ctx.lineTo(x + s * 0.3, y + s * 0.3)
    ctx.closePath(); ctx.fill() },
  spear(ctx, x, y, s, p) { base(ctx, x, y, s, p); ctx.strokeStyle = p.glow; ctx.lineWidth = s * 0.08; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(x - s * 0.2, y + s * 0.34); ctx.lineTo(x + s * 0.18, y - s * 0.34); ctx.stroke()
    ctx.fillStyle = p.glow; ctx.beginPath(); ctx.moveTo(x + s * 0.18, y - s * 0.36)
    ctx.lineTo(x + s * 0.32, y - s * 0.18); ctx.lineTo(x + s * 0.06, y - s * 0.2); ctx.closePath(); ctx.fill() }
}

function bull(ctx, x, y, s, p, color) {
  base(ctx, x, y, s, p)
  ctx.fillStyle = color
  ctx.beginPath(); ctx.ellipse(x, y + s * 0.06, s * 0.3, s * 0.22, 0, 0, TAU); ctx.fill()
  ctx.strokeStyle = color; ctx.lineWidth = s * 0.07; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(x - s * 0.22, y - s * 0.16); ctx.quadraticCurveTo(x - s * 0.34, y - s * 0.34, x - s * 0.16, y - s * 0.32); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(x + s * 0.22, y - s * 0.16); ctx.quadraticCurveTo(x + s * 0.34, y - s * 0.34, x + s * 0.16, y - s * 0.32); ctx.stroke()
}

function base(ctx, x, y, s, p) {
  glow(ctx, x, y, s * 0.95, p.glow, 0.5)
  const g = ctx.createRadialGradient(x, y, 0, x, y, s * 0.62)
  g.addColorStop(0, shade(p.deep, 20)); g.addColorStop(1, p.deep)
  ctx.fillStyle = g
  ctx.beginPath(); ctx.arc(x, y, s * 0.6, 0, TAU); ctx.fill()
  ctx.strokeStyle = hexA(p.glow, 0.4); ctx.lineWidth = 1.2
  ctx.beginPath(); ctx.arc(x, y, s * 0.6, 0, TAU); ctx.stroke()
}

/* ── shared helpers ────────────────────────────────────────────────────── */

function eyes(ctx, cx, cy, r, color, spread) {
  ctx.fillStyle = color
  for (const d of [-1, 1]) {
    ctx.beginPath(); ctx.arc(cx + d * r * 0.9 * spread, cy, r * 0.5, 0, TAU); ctx.fill()
    ctx.fillStyle = hexA('#ffffff', 0.55)
    ctx.beginPath(); ctx.arc(cx + d * r * 0.9 * spread + r * 0.22, cy - r * 0.18, r * 0.18, 0, TAU); ctx.fill()
    ctx.fillStyle = color
  }
}

/** color "#rrggbb" + alpha 0..1 → rgba string */
export function hexA(hex, a) {
  const { r, g, b } = parse(hex)
  return `rgba(${r},${g},${b},${a})`
}

/** lighten/darken a hex by amount (-100..100) */
export function shade(hex, amt) {
  const { r, g, b } = parse(hex)
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + (amt / 100) * 255)))
  return `rgb(${f(r)},${f(g)},${f(b)})`
}

function parse(hex) {
  if (hex[0] === '#') hex = hex.slice(1)
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('')
  const n = parseInt(hex, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}
