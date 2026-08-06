import { readFileSync } from 'node:fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

interface SoriONBuildInfo {
  schemaVersion: 1
  appVersion: string
  heartbeat: string
  revision: string
  buildId: string
}

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string }
const heartbeat = '6.8.4'
const revision = (
  process.env.VITE_BUILD_REVISION?.trim()
  || process.env.GITHUB_SHA?.slice(0, 12).trim()
  || 'local'
)
const buildInfo: SoriONBuildInfo = {
  schemaVersion: 1,
  appVersion: packageJson.version,
  heartbeat,
  revision,
  buildId: `${packageJson.version}-${heartbeat}-${revision}`,
}

function normalizeBasePath(value?: string) {
  const trimmed = value?.trim()
  if (!trimmed || trimmed === '/') return '/'
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}/`
}

function buildInfoPlugin(info: SoriONBuildInfo): Plugin {
  return {
    name: 'sorion-build-info',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: `${JSON.stringify(info, null, 2)}\n`,
      })
    },
  }
}

export default defineConfig(() => {
  const base = normalizeBasePath(process.env.VITE_BASE_PATH)

  return {
    base,
    define: {
      __SORION_BUILD_INFO__: JSON.stringify(buildInfo),
    },
    plugins: [
      buildInfoPlugin(buildInfo),
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
