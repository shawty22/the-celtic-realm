/* =========================================================================
   store.js — tiny localStorage persistence.
   Holds each creature's accumulated memory tags and the story progress,
   so the hearth remembers itself between visits. No backend, no accounts.
   ========================================================================= */

const KEY = 'celtic-realm:hearth:v1'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}

function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    /* storage may be unavailable (private mode); the hearth still runs, just forgetful */
  }
}

export class Store {
  constructor() {
    this.data = load()
    this.data.memories ||= {}
    this.data.journal ||= []
    this.data.story ||= { beat: 0, seen: [] }
  }

  memoriesFor(id) {
    return this.data.memories[id] ? [...this.data.memories[id]] : []
  }

  saveMemories(id, mems) {
    this.data.memories[id] = mems
    save(this.data)
  }

  pushJournal(entry) {
    this.data.journal.unshift(entry)
    if (this.data.journal.length > 60) this.data.journal.pop()
    save(this.data)
  }

  journal() {
    return this.data.journal
  }

  storyState() {
    return this.data.story
  }

  saveStory(state) {
    this.data.story = state
    save(this.data)
  }

  reset() {
    this.data = { memories: {}, journal: [], story: { beat: 0, seen: [] } }
    save(this.data)
  }
}
