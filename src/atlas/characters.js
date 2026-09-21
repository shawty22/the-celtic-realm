import charData    from '../data/characters.json'
import catalogData from '../data/stories-catalog.json'

const chars    = charData.characters
const catalog  = catalogData

// ── Public API ────────────────────────────────────────────────────────────── //

export function getCharacter(id) {
  return chars.find(c => c.id === id) ?? null
}

export function getCharactersForStory(storyId) {
  const story = catalog.find(s => s.id === storyId)
  if (!story?.cast) return []
  return story.cast.map(entry => {
    const char = getCharacter(entry.characterId)
    return char ? { ...char, roleInStory: entry.role } : null
  }).filter(Boolean)
}

// ── Character modal ───────────────────────────────────────────────────────── //

let _modalEl   = null
let _overlayEl = null
let _contentEl = null
let _mapRef    = null
let _allData   = null

export function initCharacters(map, allData) {
  _mapRef   = map
  _allData  = allData
  _modalEl   = document.getElementById('char-modal')
  _overlayEl = document.querySelector('.char-modal-backdrop')
  _contentEl = document.getElementById('char-modal-content')

  _overlayEl?.addEventListener('click', closeCharModal)
  document.getElementById('char-modal-close')?.addEventListener('click', closeCharModal)

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && _modalEl?.classList.contains('is-open')) closeCharModal()
  })

  // Delegated click handler for any .char-chip or .char-open-btn
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-char-id]')
    if (btn && (btn.classList.contains('char-chip') || btn.classList.contains('char-open-btn'))) {
      const storyId = btn.dataset.storyId || null
      openCharModal(btn.dataset.charId, storyId)
    }
  })
}

export function openCharModal(charId, storyId) {
  const char = getCharacter(charId)
  if (!char || !_modalEl) return

  const story = storyId ? catalog.find(s => s.id === storyId) : null
  const roleEntry = story?.cast?.find(c => c.characterId === charId)
  const role = roleEntry?.role || null

  _contentEl.innerHTML = _buildCharModalHTML(char, role, story)
  _modalEl.classList.add('is-open')
  _modalEl.setAttribute('aria-hidden', 'false')

  // Highlight related places button
  const hlBtn = _contentEl.querySelector('.char-highlight-places')
  if (hlBtn) {
    hlBtn.addEventListener('click', () => _highlightCharacterPlaces(char))
  }

  // Related story links
  _contentEl.querySelectorAll('.char-story-link').forEach(btn => {
    btn.addEventListener('click', () => {
      closeCharModal()
      document.dispatchEvent(new CustomEvent('atlas:enterStory', {
        detail: { storyId: btn.dataset.storyId, beatIndex: 0 }
      }))
    })
  })

  // Related character links
  _contentEl.querySelectorAll('.char-related-link').forEach(btn => {
    btn.addEventListener('click', () => {
      openCharModal(btn.dataset.charId, storyId)
    })
  })
}

export function closeCharModal() {
  _modalEl?.classList.remove('is-open')
  _modalEl?.setAttribute('aria-hidden', 'true')
}

// ── Beat panel helpers ────────────────────────────────────────────────────── //

export function renderPrimaryCharCard(char, storyId) {
  if (!char) return ''
  const story  = storyId ? catalog.find(s => s.id === storyId) : null
  const entry  = story?.cast?.find(c => c.characterId === char.id)
  const glyph  = _cycleGlyph(char.cycle)
  const role   = entry?.role || char.summary || ''

  return `
    <div class="beat-primary-char" data-char-id="${_x(char.id)}" data-story-id="${_x(storyId || '')}">
      <div class="beat-char-art" style="--char-glow:${char.palette?.glow || '#888'}">
        <div class="beat-char-art-inner${char.imageFile ? ' has-art' : ''}">
          <div class="beat-char-placeholder">
            <span class="beat-char-glyph">${glyph}</span>
          </div>
          ${char.imageFile
            ? `<img src="/assets/characters/${_x(char.imageFile)}" alt="${_x(char.name)}"
                 onerror="this.closest('.beat-char-art-inner').classList.remove('has-art')"
                 class="beat-char-img" loading="lazy" />`
            : ''}
        </div>
      </div>
      <div class="beat-char-info">
        <span class="beat-char-name">${_x(char.name)}</span>
        <span class="beat-char-title">${_x(char.title)}</span>
        <p class="beat-char-role">${_x(role)}</p>
      </div>
      <button class="char-open-btn" data-char-id="${_x(char.id)}" data-story-id="${_x(storyId || '')}"
        aria-label="View character: ${_x(char.name)}" title="View full character">↗</button>
    </div>
  `
}

export function renderCastChips(charIds, storyId) {
  if (!charIds?.length) return ''
  const chips = charIds.map(id => {
    const c = getCharacter(id)
    if (!c) return ''
    return `<button class="char-chip cycle-chip-${_x(c.cycle)}"
      data-char-id="${_x(c.id)}"
      data-story-id="${_x(storyId || '')}"
      title="${_x(c.summary || c.plain)}"
      aria-label="${_x(c.name)} — ${_x(c.title)}"
    >${_x(c.name)}</button>`
  }).join('')

  return `<div class="beat-cast-chips">${chips}</div>`
}

// ── Private ───────────────────────────────────────────────────────────────── //

function _buildCharModalHTML(char, roleInStory, story) {
  const cycleLabel  = _cycleName(char.cycle)
  const typeLabel   = _capitalize(char.type || 'person')
  const glyph       = _cycleGlyph(char.cycle)
  const altNames    = char.nameAlternate?.length
    ? `<p class="cmod-alt-names">Also known as: ${char.nameAlternate.map(_x).join(', ')}</p>`
    : ''
  const irishName = char.nameIrish
    ? `<p class="cmod-irish">${_x(char.nameIrish)}</p>`
    : ''
  const pronunciation = char.pronunciation
    ? `<span class="cmod-pron">/${_x(char.pronunciation)}/</span>`
    : ''

  const artHTML = `
    <div class="cmod-art" style="--char-glow:${char.palette?.glow || '#888'};--char-deep:${char.palette?.deep || '#333'}">
      <div class="cmod-art-inner${char.imageFile ? ' has-art' : ''}">
        <div class="cmod-art-placeholder">
          <div class="cmod-art-border"></div>
          <span class="cmod-art-glyph">${glyph}</span>
          <span class="cmod-art-name">${_x(char.name)}</span>
          <span class="cmod-art-pending">Artwork pending</span>
        </div>
        ${char.imageFile
          ? `<img class="cmod-art-img" src="/assets/characters/${_x(char.imageFile)}" alt="${_x(char.name)}"
               loading="lazy" onerror="this.closest('.cmod-art-inner').classList.remove('has-art')" />`
          : ''}
      </div>
    </div>
  `

  const roleHTML = roleInStory
    ? `<div class="cmod-section">
        <h4 class="cmod-section-h">Role in this story</h4>
        <p class="cmod-role-text">${_x(roleInStory)}</p>
      </div>`
    : ''

  const descText = char.description || char.plain || ''
  const descHTML = descText
    ? `<div class="cmod-section">
        <p class="cmod-description">${_autoLinkChars(descText, char.id)}</p>
      </div>`
    : ''

  const relatedStoriesHTML = char.relatedStories?.length
    ? `<div class="cmod-section">
        <h4 class="cmod-section-h">Appears in</h4>
        <div class="cmod-story-links">
          ${char.relatedStories.map(sid => {
            const s = catalog.find(c => c.id === sid)
            return s
              ? `<button class="char-story-link cycle-badge-${_x(s.cycle)}" data-story-id="${_x(s.id)}">
                  ${_x(s.title)}
                 </button>`
              : ''
          }).join('')}
        </div>
      </div>`
    : ''

  const relatedCharsHTML = char.relatedCharacters?.length
    ? `<div class="cmod-section">
        <h4 class="cmod-section-h">Connected figures</h4>
        <div class="cmod-related-chars">
          ${char.relatedCharacters.map(cid => {
            const rc = getCharacter(cid)
            return rc
              ? `<button class="char-related-link cycle-chip-${_x(rc.cycle)}" data-char-id="${_x(rc.id)}">
                  ${_x(rc.name)}
                 </button>`
              : ''
          }).join('')}
        </div>
      </div>`
    : ''

  const st = char.sourceTrail
  const sourceTrailHTML = st
    ? `<div class="cmod-section cmod-source-trail">
        <h4 class="cmod-section-h">How do we know this?</h4>
        ${st.primary   ? `<div class="cmod-src-row"><span class="cmod-src-key">Primary source</span><span class="cmod-src-val">${_x(st.primary)}</span></div>` : ''}
        ${st.earliest  ? `<div class="cmod-src-row"><span class="cmod-src-key">Earliest manuscript</span><span class="cmod-src-val">${_x(st.earliest)}</span></div>` : ''}
        ${st.oral      ? `<div class="cmod-src-row"><span class="cmod-src-key">Oral tradition</span><span class="cmod-src-val">${_x(st.oral)}</span></div>` : ''}
        ${st.confidence ? `<div class="cmod-src-row"><span class="cmod-src-key">Confidence</span><span class="cmod-src-val cmod-conf-${_x(st.confidence)}">${_x(st.confidence.toUpperCase())}</span></div>` : ''}
        ${st.notes     ? `<div class="cmod-src-notes">${_x(st.notes)}</div>` : ''}
      </div>`
    : ''

  const hlBtn = char.relatedPlaces?.length
    ? `<button class="char-highlight-places">
        Highlight all locations on map
      </button>`
    : ''

  return `
    <div class="cmod-header" data-cycle="${_x(char.cycle)}">
      <div class="cmod-meta">
        <span class="cmod-cycle-badge cycle-badge-${_x(char.cycle)}">${_x(cycleLabel)}</span>
        <span class="cmod-type-badge">${_x(typeLabel)}</span>
      </div>
      <h2 class="cmod-name">${_x(char.name)} ${pronunciation}</h2>
      ${irishName}
      <p class="cmod-title-line">${_x(char.title)}</p>
      ${altNames}
    </div>
    <div class="cmod-body">
      ${artHTML}
      ${roleHTML}
      ${descHTML}
      ${relatedStoriesHTML}
      ${relatedCharsHTML}
      ${sourceTrailHTML}
      ${hlBtn}
    </div>
  `
}

function _highlightCharacterPlaces(char) {
  if (!char.relatedPlaces?.length) return
  closeCharModal()
  document.dispatchEvent(new CustomEvent('atlas:highlightPlaces', {
    detail: { placeIds: char.relatedPlaces }
  }))
}

// ── Character name auto-linking ───────────────────────────────────────────── //

let _nameIndex = null
function _getNameIndex() {
  if (_nameIndex) return _nameIndex
  _nameIndex = []
  for (const c of chars) {
    if (c.name) _nameIndex.push({ name: c.name, id: c.id, cycle: c.cycle })
    if (Array.isArray(c.nameAlternate)) {
      for (const alt of c.nameAlternate) {
        if (alt) _nameIndex.push({ name: alt, id: c.id, cycle: c.cycle })
      }
    }
  }
  _nameIndex.sort((a, b) => b.name.length - a.name.length)
  return _nameIndex
}

function _autoLinkChars(rawText, currentCharId) {
  if (!rawText) return ''
  const index = _getNameIndex().filter(e => e.id !== currentCharId)
  if (!index.length) return _x(rawText)

  const isLetterish = (c) => c && /[\wÀ-ɏ]/.test(c)
  const replacements = []

  for (const { name, id, cycle } of index) {
    let pos = 0
    while (pos < rawText.length) {
      const idx = rawText.indexOf(name, pos)
      if (idx === -1) break
      const before = idx > 0 ? rawText[idx - 1] : ''
      const after  = rawText[idx + name.length] || ''
      if (!isLetterish(before) && !isLetterish(after)) {
        const end = idx + name.length
        const overlaps = replacements.some(r => idx < r[1] && end > r[0])
        if (!overlaps) replacements.push([idx, end, id, cycle, name])
      }
      pos = idx + 1
    }
  }

  replacements.sort((a, b) => a[0] - b[0])

  let result = ''
  let last = 0
  for (const [start, end, id, cycle, name] of replacements) {
    result += _x(rawText.slice(last, start))
    result += `<button class="char-chip char-open-btn cycle-chip-${_x(cycle)}" data-char-id="${_x(id)}">${_x(name)}</button>`
    last = end
  }
  result += _x(rawText.slice(last))
  return result
}

function _cycleGlyph(cycle) {
  return { mythological: '✦', ulster: '⚔', fenian: '◈' }[cycle] || '◎'
}

function _cycleName(cycle) {
  return { mythological: 'Mythological Cycle', ulster: 'Ulster Cycle', fenian: 'Fenian Cycle' }[cycle] || cycle || ''
}

function _capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : ''
}

function _x(s) {
  return String(s ?? '').replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])
  )
}
