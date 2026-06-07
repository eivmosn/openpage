import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1600,
  },
  plugins: [vue()],
  resolve: {
    alias: {
      '@openpage/adapter': fileURLToPath(new URL('../packages/adapter/src/index.ts', import.meta.url)),
      '@openpage/core': fileURLToPath(new URL('../packages/core/src/index.ts', import.meta.url)),
    },
  },
})
