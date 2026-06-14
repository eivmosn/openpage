import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: false,
  deps: {
    neverBundle: ['@openpage/overlay', '@openpage/script-runner', 'vue'],
  },
})
