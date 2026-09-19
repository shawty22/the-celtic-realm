/**
 * view-controller.js — primary four-view shell
 * Views: read | art | atlas | learn
 * Primary nav switches between them; modals/overlays sit above all views.
 */

let _current = null
let _learnOpenFn = null   // injected by main.js

const VIEW_IDS = ['read', 'art', 'atlas', 'learn']

export function initViewShell({ openReadFn, openArtFn, openLearnFn }) {
  _learnOpenFn = openLearnFn

  document.querySelectorAll('.pnav-btn[data-view]').forEach(btn => {
    btn.addEventListener('click', () => activateView(btn.dataset.view))
  })

  // Cross-view routing — switch to the right tab first, then open entity
  document.addEventListener('nav:switchView', e => activateView(e.detail.view))

  // When atlas flyTo is requested from Reader margin, switch to atlas first
  document.addEventListener('atlas:flyToLocation', () => {
    if (_current !== 'atlas') activateView('atlas')
  })
}

export function activateView(viewId) {
  if (!VIEW_IDS.includes(viewId)) return
  _current = viewId

  // Body class drives CSS visibility for all four views
  VIEW_IDS.forEach(v => document.body.classList.toggle(`view-${v}`, v === viewId))

  // Update nav button state
  document.querySelectorAll('.pnav-btn[data-view]').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.view === viewId)
    btn.setAttribute('aria-pressed', String(btn.dataset.view === viewId))
  })

  // Invalidate the Leaflet map size whenever atlas becomes visible
  if (viewId === 'atlas') {
    setTimeout(() => {
      window.__atlas?.map?.invalidateSize()
    }, 50)
  }

  // LEARN tab: open learn screen (story picker if none loaded)
  if (viewId === 'learn' && _learnOpenFn) {
    _learnOpenFn()
  }

  document.dispatchEvent(new CustomEvent('view:changed', { detail: { view: viewId } }))
}

export function currentView() { return _current }
