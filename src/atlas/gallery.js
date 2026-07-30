import catalogData from '../data/stories-catalog.json'

const CYCLE_LABEL = {
  mythological: 'Mythological Cycle',
  ulster:       'Ulster Cycle',
  fenian:       'Fenian Cycle',
}

let _idx    = 0
let _slides = []
let _active = 'a'   // which img element is currently visible
let _busy   = false
let _touchX = 0
let _onDismiss = null

export function initGallery(onDismiss) {
  _onDismiss = onDismiss
  _slides    = catalogData.filter(s => s.imageFile)

  const el = document.getElementById('gallery-screen')
  if (!el || !_slides.length) return

  document.getElementById('gallery-prev')?.addEventListener('click', prev)
  document.getElementById('gallery-next')?.addEventListener('click', next)
  document.getElementById('gallery-enter')?.addEventListener('click', dismiss)

  el.addEventListener('touchstart', e => { _touchX = e.touches[0].clientX }, { passive: true })
  el.addEventListener('touchend',   e => {
    const d = e.changedTouches[0].clientX - _touchX
    if (Math.abs(d) > 50) d < 0 ? next() : prev()
  })

  document.addEventListener('keydown', e => {
    if (!el.classList.contains('is-open')) return
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); next() }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); prev() }
    else if (e.key === 'Escape') dismiss()
  })

  _loadFirst()
  el.classList.add('is-open')
}

// First load: put image directly into A, fade in
function _loadFirst() {
  const imgA = document.getElementById('gallery-img-a')
  const s    = _slides[_idx]
  imgA.alt   = s.title
  imgA.onload = () => imgA.classList.add('is-visible')
  imgA.src    = `assets/stories/${s.imageFile}`
  if (imgA.complete) imgA.classList.add('is-visible')
  _active = 'a'
  _updateCaption(s)
}

function _crossfade(s) {
  if (_busy) return
  const imgA = document.getElementById('gallery-img-a')
  const imgB = document.getElementById('gallery-img-b')
  const curr = _active === 'a' ? imgA : imgB
  const inc  = _active === 'a' ? imgB : imgA

  _busy = true
  inc.alt    = s.title
  inc.onload = () => {
    inc.classList.add('is-visible')
    curr.classList.remove('is-visible')
    _active = _active === 'a' ? 'b' : 'a'
    _busy   = false
  }
  inc.src = `assets/stories/${s.imageFile}`
  if (inc.complete) inc.onload()

  _updateCaption(s)
}

function _updateCaption(s) {
  const cycleEl = document.getElementById('gallery-cycle')
  cycleEl.textContent    = CYCLE_LABEL[s.cycle] || ''
  cycleEl.dataset.cycle  = s.cycle
  document.getElementById('gallery-title').textContent   = s.title
  document.getElementById('gallery-sub').textContent     = s.titleSub || ''
  document.getElementById('gallery-hook').textContent    = s.hook || ''
  document.getElementById('gallery-counter').textContent = `${_idx + 1} / ${_slides.length}`
}

function prev() {
  _idx = (_idx - 1 + _slides.length) % _slides.length
  _crossfade(_slides[_idx])
}

function next() {
  _idx = (_idx + 1) % _slides.length
  _crossfade(_slides[_idx])
}

function dismiss() {
  const el = document.getElementById('gallery-screen')
  el?.classList.remove('is-open')
  _onDismiss?.()
}
