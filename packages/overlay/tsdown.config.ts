import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  plugins: [
    vue(),
  ],
  dts: {
    vue: true,
  },
  clean: true,
  sourcemap: false,
  css: {
    minify: true,
  },
  deps: {
    neverBundle: ['vue'],
  },
})
