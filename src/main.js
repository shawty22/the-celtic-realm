/* =========================================================================
   main.js — light the hearth.
   Wires the three-layer realm world, the realm nav, UI panels and starts
   the animation loop.
   ========================================================================= */

import './styles/fonts.css'
import { Store } from './state/store.js'
import { World } from './world/world.js'
import { UI } from './ui/ui.js'
import { RealmNav } from './ui/nav.js'
import { Story } from './story/story.js'

const bgCanvas    = document.getElementById('bg')
const atmCanvas   = document.getElementById('atm')
const worldCanvas = document.getElementById('world')

const store = new Store()
const world = new World(bgCanvas, atmCanvas, worldCanvas, store)
const ui    = new UI(world)
const nav   = new RealmNav(world)
const story = new Story(world, ui)
ui.story    = story  // give UI its back-reference

// Clicking a creature opens its card
world.onSelect = (c) => ui.showCreature(c)

world.start()

// Retire hint after first interaction
const hint = document.getElementById('hint')
worldCanvas.addEventListener('click', () => hint?.classList.add('fade'), { once: true })
setTimeout(() => hint?.classList.add('fade'), 8000)

// Dev handle
if (import.meta.env?.DEV) window.__hearth = { world, ui, nav, store, story }
