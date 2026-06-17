/* =========================================================================
   nav.js — realm navigation tabs.
   Renders the five realm selector buttons and emits realm-switch events
   back to the world. Handles active-state styling.
   ========================================================================= */

const GLYPHS = {
  'moon-pond':    '○',
  'brigids-grove':'✦',
  'fairy-mound':  '◈',
  'mist-gate':    '◐',
  'tir-na-nog':   '✸'
}

export class RealmNav {
  constructor(world) {
    this.world = world
    this.nav = document.getElementById('realm-nav')
    if (!this.nav) return

    this._build()
    requestAnimationFrame(() => this._updateScrollShadow())
    this.nav.addEventListener('scroll', () => this._updateScrollShadow(), { passive: true })

    // React when world signals a realm change (e.g. initial load)
    world.onRealmChange = (realm) => this._setActive(realm.id)
  }

  _build() {
    this.nav.innerHTML = ''
    for (const realm of this.world.realms) {
      const btn = document.createElement('button')
      btn.className = 'realm-tab'
      btn.dataset.realm = realm.id
      btn.setAttribute('aria-label', realm.name)
      btn.innerHTML = `
        <span class="realm-tab-glyph">${GLYPHS[realm.id] ?? '·'}</span>
        <span class="realm-tab-name">${realm.name}</span>
        <span class="realm-tab-sub">${realm.subtitle}</span>
      `
      btn.addEventListener('click', () => {
        if (btn.classList.contains('is-active')) return
        this.world.switchRealm(realm.id)
        this._setActive(realm.id)
      })
      this.nav.appendChild(btn)
    }
  }

  _updateScrollShadow() {
    const el = this.nav
    const atRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2
    el.style.boxShadow = atRight
      ? 'none'
      : 'inset -28px 0 18px -10px rgba(4, 10, 18, 0.75)'
  }

  _setActive(id) {
    this.nav.querySelectorAll('.realm-tab').forEach(b => {
      b.classList.toggle('is-active', b.dataset.realm === id)
      if (b.dataset.realm === id) {
        // Smooth-scroll nav so the active tab is centred within the pill
        const tabLeft  = b.offsetLeft
        const tabWidth = b.offsetWidth
        const navWidth = this.nav.offsetWidth
        this.nav.scrollTo({ left: tabLeft - (navWidth - tabWidth) / 2, behavior: 'smooth' })
      }
    })
  }
}
