import type { Plugin } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig, normalizePath } from 'vite'

const librarySourceDirectories = [
  normalizePath(fileURLToPath(new URL('../packages/core/src/', import.meta.url))),
  normalizePath(fileURLToPath(new URL('../packages/script-runner/src/', import.meta.url))),
  normalizePath(fileURLToPath(new URL('../packages/ui/src/', import.meta.url))),
]

/**
 * 创建 OpenPage 源码调试插件。
 *
 * 库源码变更时执行完整刷新，避免 Vue HMR 保留旧组件 props 和组件映射。
 *
 * @returns 返回 OpenPage 源码调试插件。
 */
function openPageDebugPlugin(): Plugin {
  return {
    name: 'openpage-debug',
    apply: 'serve',
    handleHotUpdate(context) {
      const file = normalizePath(context.file)

      if (!librarySourceDirectories.some(directory => file.startsWith(directory))) {
        return
      }

      context.server.ws.send({ type: 'full-reload' })
      return []
    },
  }
}

export default defineConfig(() => {
  return {
    build: {
      chunkSizeWarningLimit: 1600,
    },
    plugins: [
      vue(),
      openPageDebugPlugin(),
    ],
    resolve: {
      alias: {
        '@openpage/core': fileURLToPath(new URL('../packages/core/src/index.ts', import.meta.url)),
        '@openpage/script-runner': fileURLToPath(new URL('../packages/script-runner/src/index.ts', import.meta.url)),
        '@openpage/ui': fileURLToPath(new URL('../packages/ui/src/index.ts', import.meta.url)),
      },
    },
  }
})
