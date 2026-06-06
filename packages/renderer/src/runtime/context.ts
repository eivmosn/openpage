import type { InjectionKey } from 'vue'
import type { UiAdapter } from '../adapters/types'
import type { CompiledPage } from '../types/compiled'
import type { RendererContext, RendererPlatform } from '../types/runtime'
import { inject, markRaw, provide, reactive, shallowReactive } from 'vue'
import { applyNodeDefaultValues } from './defaults'

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
 * 创建渲染器运行时上下文。
 *
 * @param compiled 当前编译后的页面结构。
 * @param state 当前页面初始状态。
 * @param adapter 当前 UI 适配器。
 * @param platform 当前平台能力。
 * @param notifyStateChange 状态变更通知函数。
 * @returns 返回可响应更新的渲染器运行时上下文。
 */
export function createRendererContext(
  compiled: CompiledPage,
  state: Record<string, unknown>,
  adapter: UiAdapter,
  platform: RendererPlatform,
  notifyStateChange: () => void,
): RendererContext {
  const context = shallowReactive<RendererContext>({
    compiled,
    state: createReactiveState(state),
    adapter,
    platform,
    notifyStateChange,
    eventHandlers: markRaw(new Map()),
    nodePatches: reactive({}),
  })

  applyNodeDefaultValues(context)

  return context
}

/**
 * 使用最新页面配置更新渲染器运行时上下文。
 *
 * @param context 需要更新的渲染器运行时上下文。
 * @param compiled 最新编译后的页面结构。
 */
export function updateRendererSchema(
  context: RendererContext,
  compiled: CompiledPage,
): void {
  context.compiled = compiled
  context.eventHandlers = markRaw(new Map())
  context.nodePatches = reactive({})

  applyNodeDefaultValues(context)
}

/**
 * 使用最新外部状态更新渲染器运行时状态。
 *
 * @param context 需要更新的渲染器运行时上下文。
 * @param state 最新外部状态。
 */
export function updateRendererState(context: RendererContext, state: Record<string, unknown>): void {
  context.state = createReactiveState(state)
  applyNodeDefaultValues(context)
}

/**
 * 将外部页面状态转为 Vue 响应式对象。
 *
 * @param state 编译产物中的初始状态。
 * @returns 返回响应式页面状态。
 */
export function createReactiveState(state: Record<string, unknown>): Record<string, unknown> {
  return reactive(state) as Record<string, unknown>
}
