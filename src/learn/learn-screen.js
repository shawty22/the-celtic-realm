/**
 * learn-screen.js — S09: LEARN / Remember / Retell
 * Three modes from story beats:
 *  1. OUTLINE — story structure at a glance
 *  2. RECALL  — flip cards to test memory
 *  3. RETELL  — guided retelling prompt sequence
 */

import catalog from '../data/stories-catalog.json'
import charData from '../data/characters.json'

const chars = charData.characters

let _el = null
let _isOpen = false
let _story = null
let _mode = 'outline'   // 'outline' | 'recall' | 'retell'
let _recallIdx = 0
let _recallFlipped = false
let _retellIdx = 0

export function initLearnScreen() {
  _el = document.getElementById('learn-screen')
  if (!_el) return

  document.getElementById('learn-screen-close')?.addEventListener('click', closeLearnScreen)
  document.querySelector('.learn-backdrop')?.addEventListener('click', closeLearnScreen)

  // Mode tabs
  _el.querySelectorAll('.learn-mode-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      _mode = tab.dataset.mode
      _el.querySelectorAll('.learn-mode-tab').forEach(t => t.classList.toggle('is-active', t === tab))
      _renderMode()
    })
  })

  document.addEventListener('keydown', e => {
    if (!_isOpen) return
    if (e.key === 'Escape') closeLearnScreen()
    if (_mode === 'recall') {
      if (e.key === ' ') { e.preventDefault(); _flipCard() }
      if (e.key === 'ArrowRight') _nextRecall(1)
      if (e.key === 'ArrowLeft') _nextRecall(-1)
    }
    if (_mode === 'retell') {
      if (e.key === 'ArrowRight') _nextRetell(1)
      if (e.key === 'ArrowLeft') _nextRetell(-1)
    }
  })
}

export function openLearnForStory(storyId) {
  _story = catalog.find(s => s.id === storyId)
  if (!_story) return
  _isOpen = true
  _mode = 'outline'
  _recallIdx = 0
  _recallFlipped = false
  _retellIdx = 0

  // Reset tabs
  _el?.querySelectorAll('.learn-mode-tab').forEach(t => t.classList.toggle('is-active', t.dataset.mode === 'outline'))

  // Update story header
  const headEl = document.getElementById('learn-story-header')
  if (headEl) {
    const cycleColors = { mythological: '#7a5ead', ulster: '#c8703a', fenian: '#3a8a6e' }
    headEl.innerHTML = `
      <div class="learn-story-cycle" style="background:${cycleColors[_story.cycle] || '#555'}">${_esc(_story.cycleLabel || _story.cycle)}</div>
      <h2 class="learn-story-title">${_esc(_story.title)}</h2>
      <p class="learn-story-sub">${_esc(_story.titleSub || '')}</p>
    `
  }

  _el?.classList.add('is-open')
  _el?.removeAttribute('aria-hidden')
  document.body.classList.add('learn-active')
  _renderMode()
}

export function closeLearnScreen() {
  _isOpen = false
  _el?.classList.remove('is-open')
  _el?.setAttribute('aria-hidden', 'true')
  document.body.classList.remove('learn-active')
}

// Open learn picker — shows story selector if no story loaded; else resumes last story
export function openLearnPicker() {
  if (_story) {
    openLearnForStory(_story.id)
    return
  }
  _isOpen = true
  _el?.classList.add('is-open')
  _el?.removeAttribute('aria-hidden')
  document.body.classList.add('learn-active')

  const headEl = document.getElementById('learn-story-header')
  if (headEl) headEl.innerHTML = '<h2 class="learn-story-title">Choose a story</h2>'

  const body = document.getElementById('learn-body')
  if (!body) return

  // Render a story picker grid
  const picks = catalog.filter(s => s.beats?.length > 0)
  const cycleColors = { mythological: '#7a5ead', ulster: '#c8703a', fenian: '#3a8a6e' }
  body.innerHTML = `
    <div class="learn-picker">
      <p class="learn-picker-hint">Select a story below to begin Outline, Recall, or Retell.</p>
      <div class="learn-picker-grid">
        ${picks.map(s => `
          <button class="learn-picker-card" data-story-id="${_esc(s.id)}">
            <span class="learn-picker-cycle" style="background:${cycleColors[s.cycle] || '#555'}">${_esc(s.cycleLabel || s.cycle)}</span>
            <span class="learn-picker-title">${_esc(s.title)}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `
  body.querySelectorAll('.learn-picker-card').forEach(btn => {
    btn.addEventListener('click', () => openLearnForStory(btn.dataset.storyId))
  })
}

// ── Mode rendering ──────────────────────────────────────────────────────── //

function _renderMode() {
  const body = document.getElementById('learn-body')
  if (!body || !_story) return

  if (_mode === 'outline')  body.innerHTML = _buildOutline()
  if (_mode === 'recall')   { body.innerHTML = _buildRecall(); _wireRecall() }
  if (_mode === 'retell')   { body.innerHTML = _buildRetell(); _wireRetell() }
}

// OUTLINE — story arc at a glance
function _buildOutline() {
  const beats = _story.beats || []
  return `
    <div class="learn-outline">
      <p class="learn-intro">${_esc(_story.hook)}</p>
      <ol class="learn-beat-list">
        ${beats.map((b, i) => `
          <li class="learn-beat-row">
            <div class="learn-beat-num">${i + 1}</div>
            <div class="learn-beat-content">
              <h4 class="learn-beat-title">${_esc(b.title)}</h4>
              <p class="learn-beat-scene">${_esc(b.scene)}</p>
              <p class="learn-beat-plain">${_esc(b.plain)}</p>
              ${_charChipsHTML(b)}
            </div>
          </li>
        `).join('')}
      </ol>
    </div>
  `
}

// RECALL — flip cards: front = scene, back = plain prose
function _buildRecall() {
  const beats = _story.beats || []
  const b = beats[_recallIdx]
  if (!b) return '<p class="learn-empty">No beats available.</p>'

  return `
    <div class="learn-recall">
      <div class="learn-card ${_recallFlipped ? 'is-flipped' : ''}" id="learn-card">
        <div class="learn-card-front">
          <div class="learn-card-label">Beat ${_recallIdx + 1} of ${beats.length}</div>
          <h3 class="learn-card-title">${_esc(b.title)}</h3>
          <p class="learn-card-scene">${_esc(b.scene)}</p>
          <p class="learn-card-hint">Tap to reveal</p>
        </div>
        <div class="learn-card-back">
          <div class="learn-card-label">Beat ${_recallIdx + 1} of ${beats.length}</div>
          <h3 class="learn-card-title">${_esc(b.title)}</h3>
          <p class="learn-card-plain">${_esc(b.plain)}</p>
          ${_charChipsHTML(b)}
        </div>
      </div>
      <div class="learn-card-controls">
        <button class="learn-nav-btn" id="recall-prev">← Prev</button>
        <div class="learn-card-dots">${(beats.map((_, i) =>
          `<span class="learn-dot ${i === _recallIdx ? 'is-active' : ''}"></span>`
        )).join('')}</div>
        <button class="learn-nav-btn" id="recall-next">Next →</button>
      </div>
      <p class="learn-recall-hint">Space to flip · ← → to navigate</p>
    </div>
  `
}

// RETELL — guided prompts only, no answers visible
function _buildRetell() {
  const beats = _story.beats || []
  const b = beats[_retellIdx]
  if (!b) return '<p class="learn-empty">No beats available.</p>'

  return `
    <div class="learn-retell">
      <div class="learn-retell-card">
        <div class="learn-retell-prompt-label">Tell the story — beat ${_retellIdx + 1} of ${beats.length}</div>
        <h3 class="learn-retell-title">${_esc(b.title)}</h3>
        <p class="learn-retell-cue">"${_esc(b.scene)}"</p>
        <div class="learn-retell-hint">
          <span class="retell-who">${_primaryCharName(b)}</span>
          <span class="retell-where">${b.locationId ? '📍 ' + _esc(b.locationId.replace(/-/g, ' ')) : ''}</span>
        </div>
        <textarea class="learn-retell-textarea" placeholder="Retell this beat in your own words…" rows="6"></textarea>
      </div>
      <div class="learn-retell-controls">
        <button class="learn-nav-btn" id="retell-prev">← Prev</button>
        <div class="learn-card-dots">${beats.map((_, i) =>
          `<span class="learn-dot ${i === _retellIdx ? 'is-active' : ''}"></span>`
        ).join('')}</div>
        <button class="learn-nav-btn" id="retell-next">${_retellIdx === beats.length - 1 ? 'Finish ✓' : 'Next →'}</button>
      </div>
    </div>
  `
}

// ── Event wiring ─────────────────────────────────────────────────────────── //

function _wireRecall() {
  document.getElementById('learn-card')?.addEventListener('click', _flipCard)
  document.getElementById('recall-prev')?.addEventListener('click', () => _nextRecall(-1))
  document.getElementById('recall-next')?.addEventListener('click', () => _nextRecall(1))
}

function _wireRetell() {
  document.getElementById('retell-prev')?.addEventListener('click', () => _nextRetell(-1))
  document.getElementById('retell-next')?.addEventListener('click', () => _nextRetell(1))
}

function _flipCard() {
  _recallFlipped = !_recallFlipped
  document.getElementById('learn-card')?.classList.toggle('is-flipped', _recallFlipped)
}

function _nextRecall(dir) {
  const beats = _story?.beats || []
  _recallIdx = (_recallIdx + dir + beats.length) % beats.length
  _recallFlipped = false
  _renderMode()
}

function _nextRetell(dir) {
  const beats = _story?.beats || []
  const next = _retellIdx + dir
  if (next >= beats.length) { closeLearnScreen(); return }
  if (next < 0) return
  _retellIdx = next
  _renderMode()
}

// ── Helpers ──────────────────────────────────────────────────────────────── //

function _charChipsHTML(beat) {
  const ids = [beat.primaryCharacter, ...(beat.castChips || [])].filter(Boolean)
  if (!ids.length) return ''
  const chips = ids.map(id => {
    const c = chars.find(x => x.id === id)
    return c ? `<span class="learn-char-chip">${_esc(c.name)}</span>` : ''
  }).join('')
  return chips ? `<div class="learn-char-chips">${chips}</div>` : ''
}

function _primaryCharName(beat) {
  if (!beat.primaryCharacter) return ''
  const c = chars.find(x => x.id === beat.primaryCharacter)
  return c ? c.name : ''
}

function _esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])
  )
}
