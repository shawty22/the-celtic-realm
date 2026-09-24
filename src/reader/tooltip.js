/**
 * tooltip.js — hover tooltip for enriched reader tokens
 *
 * Shows a floating card on mouseover/focus of .er-token spans:
 *   - Characters with art: portrait + name + title + summary
 *   - Characters without art: glyph + name + title + summary
 *   - Places: pin icon + name + location + summary
 *   - Groups/peoples: symbol + name + title + summary
 *
 * Click on any token opens the character modal (if a char) or fires
 * atlas:flyToLocation (if a place).
 */

import { getEntity } from './annotator.js'

const CYCLE_GLYPH = { mythological: '✦', ulster: '⚔', fenian: '◈' }
const TYPE_LABEL  = { char: '', place: 'Place', people: 'Peoples', group: 'Group', 'place-type': 'Concept' }

let _tipEl    = null
let _hideTimer = null

export function initTooltip() {
  _tipEl = document.getElementById('er-tooltip')
  if (!_tipEl) return

  // Hide on scroll / Escape
  document.addEventListener('scroll', _hide, { passive: true, capture: true })
  document.addEventListener('keydown', e => { if (e.key === 'Escape') _hide() })

  // Delegated events on the entire document for er-token spans
  document.addEventListener('mouseover', _onTokenEnter)
  document.addEventListener('mouseout',  _onTokenLeave)
  document.addEventListener('focusin',   _onTokenEnter)
  document.addEventListener('focusout',  _onTokenLeave)
  document.addEventListener('click',     _onTokenClick)

  // Keep tooltip alive while hovering over it
  _tipEl.addEventListener('mouseenter', () => {
    if (_hideTimer) { clearTimeout(_hideTimer); _hideTimer = null }
  })
  _tipEl.addEventListener('mouseleave', _scheduleHide)
}

// ── Event handlers ────────────────────────────────────────────────────────── //

function _onTokenEnter(e) {
  if (!document.body.classList.contains('reader-enriched')) return
  const token = e.target.closest?.('.er-token')
  if (!token) return
  if (_hideTimer) { clearTimeout(_hideTimer); _hideTimer = null }
  const entity = getEntity(token.dataset.erId)
  if (!entity) return
  _show(entity, token)
}

function _onTokenLeave(e) {
  if (!e.target.closest?.('.er-token')) return
  _scheduleHide()
}

function _onTokenClick(e) {
  if (!document.body.classList.contains('reader-enriched')) return
  const token = e.target.closest?.('.er-token')
  if (!token) return
  e.stopPropagation()
  const entity = getEntity(token.dataset.erId)
  if (!entity) return
  _hide()
  if (entity.type === 'char') {
    document.dispatchEvent(new CustomEvent('reader:openChar', { detail: { charId: entity.id } }))
  } else if (entity.type === 'place') {
    document.dispatchEvent(new CustomEvent('reader:flyToPlace', { detail: { placeId: entity.id } }))
  }
}

function _scheduleHide() {
  _hideTimer = setTimeout(_hide, 220)
}

function _hide() {
  if (_tipEl) _tipEl.hidden = true
  if (_hideTimer) { clearTimeout(_hideTimer); _hideTimer = null }
}

// ── Render & position ─────────────────────────────────────────────────────── //

function _show(entity, anchorEl) {
  if (!_tipEl) return

  _tipEl.innerHTML = _buildHTML(entity)
  _tipEl.hidden = false

  // Position near the anchor
  const rect  = anchorEl.getBoundingClientRect()
  const tipH  = _tipEl.offsetHeight || 200
  const tipW  = _tipEl.offsetWidth  || 260
  const vp    = { w: window.innerWidth, h: window.innerHeight }

  let top  = rect.bottom + 8
  let left = rect.left

  // Flip above if too close to bottom
  if (top + tipH > vp.h - 16) top = rect.top - tipH - 8

  // Clamp horizontally
  if (left + tipW > vp.w - 16) left = vp.w - tipW - 16
  if (left < 8) left = 8

  _tipEl.style.top  = `${top}px`
  _tipEl.style.left = `${left}px`
}

function _buildHTML(entity) {
  const x = s => String(s ?? '').replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

  const cycle = entity.cycle
  const glyph = CYCLE_GLYPH[cycle] || (entity.type === 'place' ? '📍' : '◎')
  const typeLabel = TYPE_LABEL[entity.type] || ''
  const cycleBadge = cycle
    ? `<span class="er-tip-cycle cycle-chip-${x(cycle)}">${glyph} ${x(
        cycle === 'mythological' ? 'Mythological' : cycle === 'ulster' ? 'Ulster' : 'Fenian'
      )}</span>`
    : typeLabel
      ? `<span class="er-tip-type">${typeLabel}</span>`
      : ''

  const portrait = entity.imageFile
    ? `<div class="er-tip-portrait">
        <img src="/assets/characters/${x(entity.imageFile)}" alt="${x(entity.name)}"
          loading="lazy" onerror="this.closest('.er-tip-portrait').style.display='none'" />
       </div>`
    : `<div class="er-tip-glyph">${glyph}</div>`

  const action = entity.type === 'char'
    ? `<span class="er-tip-action">${entity.hasArt ? 'Click to view art card →' : 'Click to view →'}</span>`
    : entity.type === 'place'
      ? `<span class="er-tip-action">Click to fly to on atlas →</span>`
      : ''

  const summary = (entity.summary || '').slice(0, 220) + ((entity.summary || '').length > 220 ? '…' : '')

  return `
    <div class="er-tip-inner">
      ${portrait}
      <div class="er-tip-text">
        ${cycleBadge}
        <div class="er-tip-name">${x(entity.name)}</div>
        ${entity.title ? `<div class="er-tip-title">${x(entity.title)}</div>` : ''}
        ${summary ? `<p class="er-tip-summary">${x(summary)}</p>` : ''}
        ${action}
      </div>
    </div>`
}
