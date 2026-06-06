import type { InjectionKey } from 'vue'
import type { RendererContext } from '../types/runtime'
import { inject, provide, reactive } from 'vue'

export const rendererContextKey: InjectionKey<RendererContext> = Symbol('openpage-renderer-context')

/**
 * 向子组件提供渲染器运行时上下文。
 *
 * @param context 当前渲染器运行时上下文。
 */
export function provideRendererContext(context: RendererContext): void {
  provide(rendererContextKey, context)
}

/**
 * 获取渲染器运行时上下文。
 *
 * @returns 返回当前注入的渲染器运行时上下文。
 */
export function useRendererContext(): RendererContext {
  const context = inject(rendererContextKey)

  if (!context) {
    throw new Error('[openpage] renderer context not found')
  }

  return context
}

/**
 * 克隆页面初始状态并转为 Vue 响应式对象。
 *
 * @param state 编译产物中的初始状态。
 * @returns 返回响应式页面状态。
 */
export function createReactiveState(state: Record<string, unknown>): Record<string, unknown> {
  return reactive(structuredClone(state)) as Record<string, unknown>
}
