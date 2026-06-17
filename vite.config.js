import { defineConfig } from 'vite'

// The Otherworld Hearth runs entirely client-side. No backend, no env.
// JSON data lives in /src/data and is imported directly so it ships in the bundle.
export default defineConfig({
  root: '.',
  base: './',
  server: {
    port: 3010,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0
  }
})
