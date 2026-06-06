import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 800,
  },
  plugins: [vue()],
  resolve: {
    alias: {
      '@openpage/renderer': fileURLToPath(new URL('../packages/renderer/src/index.ts', import.meta.url)),
    },
  },
})
