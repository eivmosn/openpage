import type { Component, InjectionKey } from 'vue'
import type { RuntimeOpenPageService } from '../../types/runtime'
import type { OpenPageComponents } from '../../types/ui'
import { inject, provide } from 'vue'
import { createPageManager } from './manager'

export interface OpenPageRuntimeConfig {
  components?: OpenPageComponents
  pageComponent: Component
}

export interface OpenPageRuntime {
  openPage: RuntimeOpenPageService
  update: (config: OpenPageRuntimeConfig) => void
}

export const openPageRuntimeKey: InjectionKey<OpenPageRuntime> = Symbol('openPageRuntime')

/**
 * 创建根页面运行时。
 *
 * @param config 根页面运行时配置。
 * @returns 返回可被子页面复用的运行时。
 */
export function createOpenPageRuntime(config: OpenPageRuntimeConfig): OpenPageRuntime {
  const runtimeConfig: OpenPageRuntimeConfig = { ...config }
  const manager = createPageManager({
    getComponents: () => runtimeConfig.components,
    getPageComponent: () => runtimeConfig.pageComponent,
  })

  return {
    openPage: manager.openPage,
    update: (latestConfig) => {
      runtimeConfig.components = latestConfig.components
      runtimeConfig.pageComponent = latestConfig.pageComponent
    },
  }
}

/**
 * 注入根页面运行时。
 *
 * @param runtime 根页面运行时。
 */
export function provideOpenPageRuntime(runtime: OpenPageRuntime): void {
  provide(openPageRuntimeKey, runtime)
}

/**
 * 获取当前页面运行时。
 *
 * @returns 返回上层运行时；根页面外部调用时为空。
 */
export function useOpenPageRuntime(): OpenPageRuntime | undefined {
  return inject(openPageRuntimeKey, undefined)
}
