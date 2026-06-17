/* =========================================================================
   atmosphere.js — transparent WebGL atmospheric overlay.

   Sits above the background image layer. Does NOT draw sky, ground or
   landscape — only adds: mist, particles, creature glows, light shafts,
   and (in water mode) water shimmer.

   WebGL context: alpha:true, premultipliedAlpha:false
   Output: vec4(color, alpha) where 0 = fully transparent (show bg)
   ========================================================================= */

const NCREATURE = 2

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.0,1.0); }`

const FRAG = `
precision highp float;

uniform vec2  uRes;
uniform float uTime;
uniform float uMode;
uniform vec2  uMoon;
uniform vec3  uMistCol;
uniform float uMistStr;
uniform vec3  uGlowA;
uniform vec3  uGlowB;
uniform vec2  uCrPos[${NCREATURE}];
uniform vec3  uCrCol[${NCREATURE}];
uniform float uCrOn[${NCREATURE}];

float hash(vec2 p){ p=fract(p*vec2(127.1,311.7)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){
  vec2 i=floor(p),f=fract(p);
  float a=hash(i),b=hash(i+vec2(1,0)),c=hash(i+vec2(0,1)),d=hash(i+vec2(1,1));
  vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}
float fbm(vec2 p){ float s=0.0,a=0.5; for(int i=0;i<4;i++){s+=a*noise(p);p*=2.02;a*=0.5;} return s; }
float A(){ return uRes.x/uRes.y; }

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = A();
  vec3 col = vec3(0.0);
  float a = 0.0;

  /* ---- horizontal mist band ---- */
  float mistBandLo = smoothstep(0.0, 0.22, uv.y);
  float mistBandHi = smoothstep(1.0, 0.60, uv.y);
  float mistBand = mistBandLo * mistBandHi;
  float mistN = fbm(uv * vec2(2.4, 3.8) + vec2(uTime * 0.014, uTime * 0.008));
  float mist = mistBand * mistN * uMistStr;
  col += uMistCol * mist * 0.70;
  a += mist * 0.38 * uMistStr;

  /* ---- ground-hugging mist ---- */
  float groundN = fbm(vec2(uv.x * 3.2 + uTime * 0.018, uTime * 0.010));
  float groundMist = smoothstep(0.22, 0.0, uv.y) * groundN * uMistStr;
  col += uMistCol * groundMist * 0.55;
  a += groundMist * 0.28 * uMistStr;

  /* ---- creature ambient glows ---- */
  for(int i=0;i<${NCREATURE};i++){
    if(uCrOn[i] < 0.5) continue;
    vec2 d = (uv - uCrPos[i]) * vec2(asp, 1.0);
    float r = length(d);
    float pulse = 0.60 + 0.40 * sin(uTime * 1.15 + float(i) * 2.0);
    float g = exp(-r * r * 22.0) * pulse;
    col += uCrCol[i] * g * 0.80;
    a = max(a, g * 0.58);
  }

  /* ---- light shaft / moon glow ---- */
  vec2 moonD = (uv - uMoon) * vec2(asp, 1.0);
  float moonDist = length(moonD);
  float moonAngle = atan(moonD.y, moonD.x);
  float rays = (sin(moonAngle * 8.0 + uTime * 0.12) * 0.5 + 0.5)
             * (sin(moonAngle * 5.0 - uTime * 0.09) * 0.5 + 0.5);
  float shaftBase = exp(-moonDist * 5.0) * smoothstep(0.0, 0.18, moonDist);
  col += uGlowA * rays * shaftBase * 0.62;
  a = max(a, rays * shaftBase * 0.52);

  /* ---- floating particles (spores / fireflies / pollen) ---- */
  float speed = 1.0 + uMode * 0.3;
  vec2 pUV = uv * vec2(asp * 78.0, 72.0) + vec2(uTime * 0.28 * speed, -uTime * 0.18 * speed);
  vec2 pI = floor(pUV), pF = fract(pUV) - 0.5;
  float ph = hash(pI);
  float wob = sin(uTime * 2.4 * ph + ph * 6.28) * 0.24;
  pF.x += wob;
  float pDist = length(pF);
  float pVis = step(0.83, ph) * smoothstep(0.26, 0.0, pDist);
  float twinkle = 0.5 + 0.5 * sin(uTime * 3.8 * ph + ph * 18.0);
  vec3 pCol = mix(uGlowA, uGlowB, hash(pI + 7.3));
  float pUp = smoothstep(0.06, 0.70, uv.y); // only above ground
  col += pCol * pVis * twinkle * pUp * 0.88;
  a = max(a, pVis * twinkle * pUp * 0.70);

  /* ---- mode 3: extra heavy rolling fog ---- */
  if(uMode > 2.5 && uMode < 3.5){
    for(int mi=0;mi<5;mi++){
      float fy = 0.20 + float(mi) * 0.14;
      float drift = fbm(vec2(uv.x * 1.8 + uTime * (0.016 + float(mi) * 0.006), float(mi) * 4.1));
      float band = exp(-pow((uv.y - fy - drift * 0.10) * 14.0, 2.0));
      float density = fbm(vec2(uv.x * 3.5 + uTime * 0.022, fy + drift * 0.5)) * 0.65;
      col += uMistCol * band * density * 1.3;
      a += band * density * 0.44 * uMistStr;
    }
  }

  /* ---- mode 0: water shimmer ---- */
  if(uMode < 0.5){
    float pondY = 0.38; // approx pond surface in GLSL UV (flipped from CSS)
    float pondBand = smoothstep(0.22, 0.0, abs(uv.y - pondY)) * smoothstep(0.0, 0.55, uv.y);
    vec2 rp = vec2(uv.x * 26.0 * asp, uv.y * 48.0) + uTime * vec2(0.45, 0.28);
    float ripple = fbm(rp);
    float caust = smoothstep(0.60, 1.0, fbm(rp * 1.35 + ripple * 1.8 + uTime * 0.12));
    col += uGlowA * caust * pondBand * 0.60;
    a = max(a, caust * pondBand * 0.50);
    // Pond mist rising
    float pondMist = smoothstep(0.50, 0.44, uv.y) * smoothstep(0.22, 0.44, uv.y)
                   * fbm(vec2(uv.x * 4.0 + uTime * 0.025, uTime * 0.015)) * uMistStr;
    col += uMistCol * pondMist * 0.50;
    a += pondMist * 0.30;
  }

  /* ---- mode 4: golden sun haze ---- */
  if(uMode > 3.5){
    float sunD = length((uv - uMoon) * vec2(asp, 1.0));
    float sunHaze = exp(-sunD * 2.8) * 0.40;
    col += uGlowA * sunHaze;
    a = max(a, sunHaze * 0.28);
    // Pollen — slower, larger particles
    vec2 polUV = uv * vec2(asp * 38.0, 36.0) + vec2(uTime * 0.10, -uTime * 0.06);
    vec2 polI = floor(polUV), polF = fract(polUV) - 0.5;
    float polH = hash(polI + 12.7);
    float polD = length(polF + sin(uTime * 1.2 * polH) * 0.3);
    float polVis = step(0.78, polH) * smoothstep(0.32, 0.0, polD);
    col += uGlowB * polVis * (0.6 + 0.4 * sin(uTime * 1.8 * polH));
    a = max(a, polVis * 0.55);
  }

  /* ---- mode 1: forest spore shimmer ---- */
  if(uMode > 0.5 && uMode < 1.5){
    float shimY = smoothstep(0.40, 0.70, uv.y) * smoothstep(1.0, 0.75, uv.y);
    float shimN = fbm(vec2(uv.x * 4.0 + uTime * 0.035, uv.y * 6.0 + uTime * 0.022));
    col += uGlowB * shimN * shimY * 0.28;
    a += shimN * shimY * 0.18;
  }

  /* ---- mode 2: fairy mound — rising spirit motes ---- */
  if(uMode > 1.5 && uMode < 2.5){
    vec2 spUV = uv * vec2(asp * 55.0, 50.0) + vec2(uTime * 0.09, -uTime * 0.32);
    vec2 spI = floor(spUV), spF = fract(spUV) - 0.5;
    float spH = hash(spI + 22.1);
    spF.x += sin(uTime * 1.9 * spH + spH * 6.28) * 0.22;
    float spD = length(spF);
    float spVis = step(0.88, spH) * smoothstep(0.20, 0.0, spD);
    float spFade = smoothstep(0.0, 0.22, uv.y) * smoothstep(0.88, 0.30, uv.y);
    float spTwink = 0.38 + 0.62 * sin(uTime * 4.4 * spH + spH * 11.0);
    vec3 spCol = mix(uGlowA, uGlowB, hash(spI + 31.4));
    col += spCol * spVis * spTwink * spFade * 1.0;
    a = max(a, spVis * spTwink * spFade * 0.72);
    // Eerie ground-level shimmer near the mound entrance
    float eer = exp(-pow((uv.y - 0.52) * 9.0, 2.0))
              * fbm(vec2(uv.x * 4.5 + uTime * 0.018, uTime * 0.011)) * 0.55;
    col += uMistCol * eer * 0.55;
    a += eer * 0.20;
  }

  /* ---- clamp and output ---- */
  a = clamp(a, 0.0, 0.88);
  col = clamp(col, 0.0, 1.0);
  gl_FragColor = vec4(col, a);
}
`

export class Atmosphere {
  constructor(canvas) {
    this.canvas = canvas
    this.ok = false

    const gl = canvas.getContext('webgl', {
      antialias: false,
      alpha: true,
      premultipliedAlpha: false
    })
    if (!gl) return
    this.gl = gl
    this.ok = true

    this.prog = this._compile(VERT, FRAG)
    gl.useProgram(this.prog)

    // Full-screen triangle
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(this.prog, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    // Normal alpha blend for transparent overlay
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    this.u = {
      res:     gl.getUniformLocation(this.prog, 'uRes'),
      time:    gl.getUniformLocation(this.prog, 'uTime'),
      mode:    gl.getUniformLocation(this.prog, 'uMode'),
      moon:    gl.getUniformLocation(this.prog, 'uMoon'),
      mistCol: gl.getUniformLocation(this.prog, 'uMistCol'),
      mistStr: gl.getUniformLocation(this.prog, 'uMistStr'),
      glowA:   gl.getUniformLocation(this.prog, 'uGlowA'),
      glowB:   gl.getUniformLocation(this.prog, 'uGlowB'),
      crPos:   gl.getUniformLocation(this.prog, 'uCrPos'),
      crCol:   gl.getUniformLocation(this.prog, 'uCrCol'),
      crOn:    gl.getUniformLocation(this.prog, 'uCrOn')
    }
  }

  _compile(vs, fs) {
    const gl = this.gl
    const sh = (type, src) => {
      const s = gl.createShader(type)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('[atmosphere] shader:', gl.getShaderInfoLog(s))
      }
      return s
    }
    const p = gl.createProgram()
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs))
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs))
    gl.linkProgram(p)
    return p
  }

  resize(w, h, dpr) {
    if (!this.ok) return
    this.canvas.width = w * dpr
    this.canvas.height = h * dpr
    this.canvas.style.width = w + 'px'
    this.canvas.style.height = h + 'px'
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
  }

  render(s) {
    if (!this.ok) return
    const { gl, u } = this
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(this.prog)
    gl.uniform2f(u.res, this.canvas.width, this.canvas.height)
    gl.uniform1f(u.time, s.time)
    gl.uniform1f(u.mode, s.mode)
    gl.uniform2fv(u.moon, s.moon)
    gl.uniform3fv(u.mistCol, s.mistCol)
    gl.uniform1f(u.mistStr, s.mistStr)
    gl.uniform3fv(u.glowA, s.glowA)
    gl.uniform3fv(u.glowB, s.glowB)
    gl.uniform2fv(u.crPos, s.crPos)
    gl.uniform3fv(u.crCol, s.crCol)
    gl.uniform1fv(u.crOn, s.crOn)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }
}

export { NCREATURE }
