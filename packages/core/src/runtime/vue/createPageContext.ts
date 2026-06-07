import type { UiAdapter } from '../../types/adapter'
import type { CompiledPage } from '../../types/compiled'
import type { PageContext, PagePlatform } from '../../types/page'
import type { RuntimeEventHandler, RuntimeServices } from '../../types/runtime'
import { markRaw, reactive, shallowReactive } from 'vue'
import { applyComponentDefaultValues } from '../defaults'

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
export function createPageContext(
  compiled: CompiledPage,
  state: Record<string, unknown>,
  adapter: UiAdapter,
  platform: PagePlatform,
  notifyStateChange: () => void,
): PageContext {
  const eventHandlers = markRaw(new Map<string, Map<string, RuntimeEventHandler>>())
  const services = shallowReactive<RuntimeServices>({
    emitNamedEvent: async (componentName, eventName, payload) => await emitNamedEvent(eventHandlers, componentName, eventName, payload),
    message: platform.message,
    notifyStateChange,
    registerEventHandler: (componentName, eventName, handler) => registerEventHandler(eventHandlers, componentName, eventName, handler),
    submitForm: async name => await eventHandlers.get(name)?.get('submit')?.(),
  })
  const context = shallowReactive<PageContext>({
    compiled,
    state: createReactiveState(state),
    adapter,
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
  const eventHandlers = markRaw(new Map())
  context.services.emitNamedEvent = async (componentName, eventName, payload) =>
    await emitNamedEvent(eventHandlers, componentName, eventName, payload)
  context.services.registerEventHandler = (componentName, eventName, handler) =>
    registerEventHandler(eventHandlers, componentName, eventName, handler)
  context.services.submitForm = async name => await eventHandlers.get(name)?.get('submit')?.()
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

/**
 * 注册指定组件的运行时事件处理器。
 *
 * @param eventHandlers 当前页面事件处理器集合。
 * @param componentName 需要注册事件的组件名称。
 * @param eventName 需要注册的事件名称。
 * @param handler 当前事件处理器。
 * @returns 返回取消注册当前事件处理器的函数。
 */
function registerEventHandler(
  eventHandlers: Map<string, Map<string, RuntimeEventHandler>>,
  componentName: string,
  eventName: string,
  handler: RuntimeEventHandler,
): () => void {
  const handlers = eventHandlers.get(componentName) || new Map<string, RuntimeEventHandler>()
  handlers.set(eventName, handler)
  eventHandlers.set(componentName, handlers)

  return () => {
    handlers.delete(eventName)

    if (handlers.size === 0) {
      eventHandlers.delete(componentName)
    }
  }
}

/**
 * 触发指定组件名称下已注册的运行时事件。
 *
 * @param eventHandlers 当前页面事件处理器集合。
 * @param componentName 需要触发事件的组件名称。
 * @param eventName 需要触发的事件名称。
 * @param payload 当前事件载荷。
 * @returns 返回事件是否已处理以及处理结果。
 */
async function emitNamedEvent(
  eventHandlers: Map<string, Map<string, RuntimeEventHandler>>,
  componentName: string,
  eventName: string,
  payload?: unknown,
): Promise<{ handled: boolean, value?: unknown }> {
  const handler = eventHandlers.get(componentName)?.get(eventName)

  if (!handler) {
    return { handled: false }
  }

  return {
    handled: true,
    value: await handler(payload),
  }
}
