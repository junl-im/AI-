import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

function normalizeBasePath(value?: string) {
  const trimmed = value?.trim()
  if (!trimmed || trimmed === '/') return '/'
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}/`
}

export default defineConfig(() => {
  const base = normalizeBasePath(process.env.VITE_BASE_PATH)

  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        base,
        registerType: 'autoUpdate',
        includeAssets: ['sorion-logo.png', 'favicon-64.png'],
        manifest: {
          name: '곰같은여우 SoriON AI',
          short_name: 'SoriON',
          description: '한국인을 위한 모바일 우선 AI Voice Platform',
          theme_color: '#0b1220',
          background_color: '#f5f3ee',
          display: 'standalone',
          orientation: 'portrait-primary',
          lang: 'ko-KR',
          start_url: './',
          scope: './',
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
            {
              src: 'pwa-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          navigateFallback: 'index.html',
          globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
        },
      }),
    ],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
    build: {
      target: 'es2022',
      sourcemap: true,
    },
  }
})
