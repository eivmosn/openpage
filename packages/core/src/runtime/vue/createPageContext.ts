import type { CompiledPage } from '../../types/compiled'
import type { PageContext, PagePlatform } from '../../types/page'
import type { RuntimeServices } from '../../types/runtime'
import type { OpenPageComponents } from '../../types/ui'
import { reactive, shallowReactive } from 'vue'
import { applyComponentDefaultValues } from '../defaults'

/**
 * 创建渲染器运行时上下文。
 *
 * @param compiled 当前编译后的页面结构。
 * @param state 当前页面初始状态。
 * @param components 当前 UI 组件映射。
 * @param platform 当前平台能力。
 * @param notifyStateChange 状态变更通知函数。
 * @returns 返回可响应更新的渲染器运行时上下文。
 */
export function createPageContext(
  compiled: CompiledPage,
  state: Record<string, unknown>,
  components: OpenPageComponents,
  platform: PagePlatform,
  notifyStateChange: () => void,
): PageContext {
  const services = shallowReactive<RuntimeServices>({
    message: platform.message,
    notifyStateChange,
  })
  const context = shallowReactive<PageContext>({
    compiled,
    state: createReactiveState(state),
    components,
    services,
    componentPatches: reactive({}),
  })

  applyComponentDefaultValues(context)

  return context
}

/**
 * 使用最新页面配置更新渲染器运行时上下文。
 *
 * @param context 需要更新的渲染器运行时上下文。
 * @param compiled 最新编译后的页面结构。
 */
export function updatePageSchema(
  context: PageContext,
  compiled: CompiledPage,
): void {
  context.compiled = compiled
  context.componentPatches = reactive({})

  applyComponentDefaultValues(context)
}

/**
 * 使用最新外部状态更新渲染器运行时状态。
 *
 * @param context 需要更新的渲染器运行时上下文。
 * @param state 最新外部状态。
 */
export function updatePageState(context: PageContext, state: Record<string, unknown>): void {
  context.state = createReactiveState(state)
  applyComponentDefaultValues(context)
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
