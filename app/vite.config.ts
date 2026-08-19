import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { sites } from '@openai/sites-vite-plugin'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [
    sites(),
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['seal.svg'],
      manifest: {
        name: '修仙手札',
        short_name: '修仙手札',
        description: '一卷随岁月展开的修仙人生',
        theme_color: '#f2ead8',
        background_color: '#f2ead8',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'seal.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
