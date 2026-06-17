/* =========================================================================
   background.js — full-screen painterly background layer.
   Loads a realm's background image (cover-fit). Falls back to a hand-crafted
   gradient placeholder so the architecture works without any art assets.
   CSS transform parallax is applied via drift() each frame.
   ========================================================================= */

const TAU = Math.PI * 2

export class BackgroundLayer {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this._img = null
    this._realm = null
    this.W = 0
    this.H = 0
  }

  resize(w, h) {
    this.W = w
    this.H = h
    // Canvas is intentionally 6% larger than viewport to cover parallax drift
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = Math.ceil(w * 1.06 * dpr)
    this.canvas.height = Math.ceil(h * 1.06 * dpr)
    this.canvas.style.width = Math.ceil(w * 1.06) + 'px'
    this.canvas.style.height = Math.ceil(h * 1.06) + 'px'
    // Keep centered so 3% bleeds on each edge
    this.canvas.style.left = '-3%'
    this.canvas.style.top = '-3%'
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this._paint()
  }

  /** Load a new realm's background. Shows placeholder immediately, then image when loaded. */
  load(realm) {
    this._realm = realm
    this._img = null
    this._paint() // placeholder first frame
    const img = new Image()
    img.onload = () => { this._img = img; this._paint() }
    img.onerror = () => { /* keep placeholder */ }
    img.src = realm.background
  }

  /** CSS transform parallax drift — called every frame from the render loop. */
  drift(normX, normY, t) {
    const dx = (normX - 0.5) * -16
    const dy = (normY - 0.5) * -8
    const breathe = Math.sin(t * 0.055) * 3
    this.canvas.style.transform = `translate(${dx + breathe * 0.4}px, ${dy + breathe * 0.25}px)`
  }

  _paint() {
    if (!this.W) return
    if (this._img) this._drawImage()
    else this._drawPlaceholder()
  }

  _drawImage() {
    const { ctx, _img: img } = this
    const W = this.canvas.offsetWidth || this.W
    const H = this.canvas.offsetHeight || this.H
    const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight)
    const sw = img.naturalWidth * scale
    const sh = img.naturalHeight * scale
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.clearRect(0, 0, W, H)
    ctx.drawImage(img, (W - sw) / 2, (H - sh) / 2, sw, sh)
  }

  _drawPlaceholder() {
    if (!this._realm) return
    const { ctx, _realm: r } = this
    const W = this.canvas.offsetWidth || this.W
    const H = this.canvas.offsetHeight || this.H
    const pal = r.placeholder
    ctx.clearRect(0, 0, W, H)

    // Sky gradient
    const skyG = ctx.createLinearGradient(0, 0, 0, H * 0.72)
    pal.skyStops.forEach((c, i) =>
      skyG.addColorStop(i / Math.max(pal.skyStops.length - 1, 1), c))
    ctx.fillStyle = skyG
    ctx.fillRect(0, 0, W, H)

    // Realm-specific scene elements
    this._placeholderScene(r, W, H)

    // Ground silhouette — organic Cartoon Saloon hill profile
    const gG = ctx.createLinearGradient(0, H * 0.55, 0, H)
    pal.groundStops.forEach((c, i) =>
      gG.addColorStop(i / Math.max(pal.groundStops.length - 1, 1), c))
    ctx.fillStyle = gG
    ctx.beginPath()
    ctx.moveTo(-10, H + 10)
    ctx.lineTo(-10, H * 0.65)
    ctx.bezierCurveTo(W * 0.10, H * 0.55, W * 0.28, H * 0.44, W * 0.48, H * 0.50)
    ctx.bezierCurveTo(W * 0.66, H * 0.56, W * 0.84, H * 0.41, W + 10, H * 0.54)
    ctx.lineTo(W + 10, H + 10)
    ctx.closePath()
    ctx.fill()

    // Foreground band — near-black strip at very bottom
    const fG = ctx.createLinearGradient(0, H * 0.80, 0, H)
    fG.addColorStop(0, 'rgba(2,4,2,0)')
    fG.addColorStop(1, 'rgba(2,4,2,0.85)')
    ctx.fillStyle = fG
    ctx.fillRect(0, H * 0.80, W, H * 0.20)

    // Realm name — barely visible watermark
    ctx.save()
    ctx.textAlign = 'center'
    ctx.font = `500 ${Math.max(28, Math.floor(H * 0.068))}px "Cormorant Garamond", Georgia, serif`
    ctx.fillStyle = 'rgba(255,248,220,0.11)'
    ctx.fillText(r.name, W / 2, H * 0.36)
    ctx.font = `400 ${Math.max(11, Math.floor(H * 0.018))}px "Avenir Next", sans-serif`
    ctx.fillStyle = 'rgba(255,248,220,0.07)'
    ctx.fillText('[ drop artwork into /public/assets/backgrounds/ ]', W / 2, H * 0.36 + H * 0.060)
    ctx.restore()
  }

  _placeholderScene(r, W, H) {
    const ctx = this.ctx
    const mode = r.atmosphereMode

    if (mode === 0) {
      // Moon Pond — dark oval pond + moon disc + reflection
      this._pond(ctx, W * 0.50, H * 0.62, W * 0.38, H * 0.19)
      // Moon disc near top-centre
      const mg = ctx.createRadialGradient(W * 0.50, H * 0.18, 0, W * 0.50, H * 0.18, H * 0.07)
      mg.addColorStop(0, 'rgba(230,245,255,0.90)')
      mg.addColorStop(0.4, 'rgba(180,215,255,0.55)')
      mg.addColorStop(1, 'rgba(100,160,220,0)')
      ctx.fillStyle = mg
      ctx.beginPath(); ctx.arc(W * 0.50, H * 0.18, H * 0.07, 0, TAU); ctx.fill()
      // Standing stones silhouettes
      for (const [sx, sw, sh] of [[0.24, 0.024, 0.22], [0.34, 0.018, 0.17], [0.66, 0.020, 0.19], [0.76, 0.028, 0.24]]) {
        this._stone(ctx, W * sx, H * 0.64 - H * sh, W * sw, H * sh)
      }

    } else if (mode === 1) {
      // Brigid's Grove — ancient tree silhouettes + sacred flame
      this._trees(ctx, W, H, 'rgba(5,12,6,0.92)', 7)
      // Sacred flame at base of largest tree
      const fg = ctx.createRadialGradient(W * 0.50, H * 0.60, 0, W * 0.50, H * 0.60, H * 0.10)
      fg.addColorStop(0, 'rgba(255,230,160,0.90)')
      fg.addColorStop(0.3, 'rgba(240,140,40,0.55)')
      fg.addColorStop(1, 'rgba(180,60,10,0)')
      ctx.fillStyle = fg
      ctx.beginPath(); ctx.arc(W * 0.50, H * 0.60, H * 0.10, 0, TAU); ctx.fill()

    } else if (mode === 2) {
      // Fairy Mound — green hill with glowing doorway
      this._mound(ctx, W * 0.50, H * 0.68, W * 0.46, H * 0.40)
      // Stars
      for (let i = 0; i < 40; i++) {
        const sx = (Math.sin(i * 2.47) * 0.5 + 0.5) * W
        const sy = (Math.abs(Math.sin(i * 3.81)) * 0.35) * H
        const sr = 0.8 + Math.abs(Math.sin(i * 1.3)) * 1.2
        ctx.fillStyle = `rgba(220,240,255,${0.2 + Math.abs(Math.sin(i * 0.9)) * 0.6})`
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill()
      }

    } else if (mode === 3) {
      // Mist Gate — stone arch, thick fog layers
      this._gate(ctx, W * 0.50, H * 0.54, H * 0.55)
      // Rolling mist bands
      for (let i = 0; i < 5; i++) {
        const fy = H * (0.32 + i * 0.10)
        const mg = ctx.createLinearGradient(0, fy - H * 0.06, 0, fy + H * 0.10)
        mg.addColorStop(0, 'rgba(140,165,195,0)')
        mg.addColorStop(0.5, `rgba(140,165,195,${0.14 - i * 0.02})`)
        mg.addColorStop(1, 'rgba(140,165,195,0)')
        ctx.fillStyle = mg
        ctx.fillRect(0, fy - H * 0.06, W, H * 0.16)
      }

    } else if (mode === 4) {
      // Tír na nÓg — bright sun, rolling emerald hills, standing stone
      // Sun glow
      const sg = ctx.createRadialGradient(W * 0.65, H * 0.20, 0, W * 0.65, H * 0.20, H * 0.26)
      sg.addColorStop(0, 'rgba(255,248,180,0.88)')
      sg.addColorStop(0.3, 'rgba(240,200,80,0.52)')
      sg.addColorStop(0.7, 'rgba(220,160,40,0.18)')
      sg.addColorStop(1, 'rgba(200,120,20,0)')
      ctx.fillStyle = sg
      ctx.fillRect(0, 0, W, H)
      // Sun disc
      const sd = ctx.createRadialGradient(W * 0.65, H * 0.20, 0, W * 0.65, H * 0.20, H * 0.075)
      sd.addColorStop(0, 'rgba(255,255,220,0.98)')
      sd.addColorStop(0.5, 'rgba(255,235,140,0.85)')
      sd.addColorStop(1, 'rgba(255,200,60,0)')
      ctx.fillStyle = sd
      ctx.beginPath(); ctx.arc(W * 0.65, H * 0.20, H * 0.075, 0, TAU); ctx.fill()
      // Standing stone
      this._stone(ctx, W * 0.38, H * 0.52 - H * 0.22, H * 0.07, H * 0.22)
    }
  }

  _pond(ctx, cx, cy, rx, ry) {
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(1, ry / rx)
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx)
    g.addColorStop(0, 'rgba(4,14,40,0.96)')
    g.addColorStop(0.65, 'rgba(3,10,28,0.94)')
    g.addColorStop(1, 'rgba(2,6,16,0.90)')
    ctx.fillStyle = g
    ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill()
    // Moonlight path
    const mg = ctx.createLinearGradient(-rx * 0.3, -rx * 0.5, rx * 0.3, rx * 0.3)
    mg.addColorStop(0, 'rgba(180,215,255,0)')
    mg.addColorStop(0.5, 'rgba(200,230,255,0.18)')
    mg.addColorStop(1, 'rgba(180,215,255,0)')
    ctx.fillStyle = mg
    ctx.fillRect(-rx, -rx, rx * 2, rx * 2)
    // Shore rim
    ctx.strokeStyle = 'rgba(60,100,180,0.22)'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.stroke()
    ctx.restore()
  }

  _stone(ctx, x, y, w, h) {
    ctx.fillStyle = 'rgba(50,46,42,0.90)'
    ctx.beginPath()
    ctx.moveTo(x - w, y + h)
    ctx.lineTo(x - w * 0.82, y)
    ctx.quadraticCurveTo(x, y - h * 0.12, x + w * 0.78, y)
    ctx.lineTo(x + w, y + h)
    ctx.closePath(); ctx.fill()
    ctx.fillStyle = 'rgba(90,84,76,0.28)'
    ctx.beginPath()
    ctx.moveTo(x + w * 0.42, y + h)
    ctx.lineTo(x + w * 0.72, y)
    ctx.lineTo(x + w, y + h * 0.9)
    ctx.lineTo(x + w, y + h)
    ctx.closePath(); ctx.fill()
  }

  _trees(ctx, W, H, color, count) {
    for (let i = 0; i < count; i++) {
      const tx = W * (i / (count - 1))
      const th = H * (0.52 + Math.abs(Math.sin(i * 2.3)) * 0.30)
      const tw = H * 0.032 + H * 0.018 * Math.abs(Math.sin(i * 1.9))
      ctx.fillStyle = color
      ctx.fillRect(tx - tw * 0.5, H - th, tw, th * 0.45)
      // Canopy — dark cloud
      const cg = ctx.createRadialGradient(tx, H - th, 0, tx, H - th, H * 0.24)
      cg.addColorStop(0, color)
      cg.addColorStop(0.65, color)
      cg.addColorStop(1, 'rgba(4,10,5,0)')
      ctx.fillStyle = cg
      ctx.beginPath(); ctx.arc(tx, H - th, H * 0.24, 0, TAU); ctx.fill()
    }
  }

  _mound(ctx, cx, cy, rx, ry) {
    // Green mound
    const g = ctx.createRadialGradient(cx, cy - ry * 0.55, ry * 0.1, cx, cy, rx)
    g.addColorStop(0, 'rgba(38,88,28,0.88)')
    g.addColorStop(0.55, 'rgba(22,56,18,0.82)')
    g.addColorStop(1, 'rgba(10,30,8,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(cx - rx, cy)
    ctx.quadraticCurveTo(cx - rx * 0.58, cy - ry, cx, cy - ry)
    ctx.quadraticCurveTo(cx + rx * 0.58, cy - ry, cx + rx, cy)
    ctx.closePath(); ctx.fill()
    // Stone lintel / entrance dark zone
    ctx.fillStyle = 'rgba(8,6,4,0.72)'
    ctx.beginPath()
    const dw = rx * 0.14, dh = ry * 0.28
    ctx.moveTo(cx - dw, cy - ry * 0.08)
    ctx.lineTo(cx - dw, cy - ry * 0.08 - dh)
    ctx.quadraticCurveTo(cx, cy - ry * 0.08 - dh - dw * 0.5, cx + dw, cy - ry * 0.08 - dh)
    ctx.lineTo(cx + dw, cy - ry * 0.08)
    ctx.closePath(); ctx.fill()
    // Door glow
    const dg = ctx.createRadialGradient(cx, cy - ry * 0.22, 0, cx, cy - ry * 0.22, ry * 0.30)
    dg.addColorStop(0, 'rgba(200,130,40,0.72)')
    dg.addColorStop(1, 'rgba(200,130,40,0)')
    ctx.fillStyle = dg
    ctx.beginPath(); ctx.arc(cx, cy - ry * 0.22, ry * 0.30, 0, TAU); ctx.fill()
  }

  _gate(ctx, cx, cy, h) {
    // Two stone posts
    const postW = h * 0.13
    for (const dir of [-1, 1]) {
      const px = cx + dir * h * 0.35
      ctx.fillStyle = 'rgba(58,52,46,0.94)'
      ctx.beginPath()
      ctx.moveTo(px - postW * 0.5, cy)
      ctx.lineTo(px - postW * 0.42, cy - h * 0.54)
      ctx.quadraticCurveTo(px, cy - h * 0.60, px + postW * 0.42, cy - h * 0.54)
      ctx.lineTo(px + postW * 0.5, cy)
      ctx.closePath(); ctx.fill()
    }
    // Lintel
    ctx.fillStyle = 'rgba(52,46,40,0.92)'
    ctx.beginPath()
    ctx.rect(cx - h * 0.46, cy - h * 0.60, h * 0.92, h * 0.08)
    ctx.fill()
    // Portal shimmer
    const pg = ctx.createLinearGradient(cx, cy - h * 0.52, cx, cy)
    pg.addColorStop(0, 'rgba(120,90,50,0)')
    pg.addColorStop(0.45, 'rgba(120,90,50,0.08)')
    pg.addColorStop(1, 'rgba(120,90,50,0)')
    ctx.fillStyle = pg
    ctx.fillRect(cx - h * 0.32, cy - h * 0.52, h * 0.64, h * 0.52)
  }
}
