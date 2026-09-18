import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  root: '.',
  base: './',
  server: {
    port: parseInt(process.env.PORT) || 3010,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'assets/**/*'],
      manifest: {
        name: 'The Celtic Realm',
        short_name: 'Celtic Realm',
        description: 'An interactive atlas of Irish mythology — three great cycles, mapped and explored.',
        theme_color: '#0d0a07',
        background_color: '#0d0a07',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        scope: './',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ],
        categories: ['education', 'books', 'lifestyle'],
        lang: 'en-IE'
      },
      workbox: {
        // Precache app shell — JS, CSS, HTML, JSON data, small images only (exclude 4x variants)
        globPatterns: ['**/*.{js,css,html,json}', 'assets/stories/*.png', 'icon.svg'],
        globIgnores: ['**/*-4x.*', '**/Photos/**', '**/_originals/**'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        runtimeCaching: [
          {
            // Artwork and character images — cache on first use
            urlPattern: /\/assets\/(stories|characters|mythological|ulster|fenian|backgrounds|locations)\/.+\.(png|webp|jpg|svg)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'celtic-realm-artwork',
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 90 // 90 days
              }
            }
          },
          {
            // Map tiles — network-first (tiles won't work offline but don't break the app)
            urlPattern: /^https:\/\/.*tile.*\.(png|jpg|pbf)$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'map-tiles',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7
              }
            }
          }
        ]
      }
    })
  ]
})
