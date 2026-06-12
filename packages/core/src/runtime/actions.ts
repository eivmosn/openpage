import type { CompiledComponent } from '../types/compiled'
import type { RuntimeComponentPatch, RuntimeContext, RuntimeFormSubmitResult } from '../types/runtime'
import type { EventSchema, StaticEventActionSchema } from '../types/schema'
import type { ValueRuntimeHelpers } from './helpers'
import { runScript } from '@openpage/script-runner'
import { getByPath, setByPath } from '../utils/path'
import { getComponentById, getComponentByName, updateComponentById, updateComponentByName } from './components'
import { resolveExpressionValue } from './expression'
import { valueRuntimeHelpers } from './helpers'

export interface EventRuntimeHelpers extends ValueRuntimeHelpers, Record<string, unknown> {
  $event: unknown
  event: unknown
  getComponentById: (id: string) => CompiledComponent | undefined
  getComponentByName: (name: string) => CompiledComponent | undefined
  getState: (path: string) => unknown
  message: NonNullable<RuntimeContext['services']['message']>
  resetForm: () => Promise<boolean>
  setState: (path: string, value: unknown) => void
  submitForm: () => Promise<boolean>
  updateComponentById: (id: string, patch: RuntimeComponentPatch) => boolean
  updateComponentByName: (name: string, patch: RuntimeComponentPatch) => boolean
}

/**
 * 执行组件事件配置。
 *
 * @param event 需要执行的事件配置。
 * @param context 当前渲染器运行时上下文。
 * @param payload 事件触发时传入的数据。
 */
export async function runActions(event: EventSchema | undefined, context: RuntimeContext, payload?: unknown): Promise<void> {
  if (!event) {
    return
  }

  if (Array.isArray(event)) {
    for (const action of event) {
      await runActions(action, context, payload)
    }
    return
  }

  if (typeof event === 'string') {
    await runScriptEvent(event, context, payload)
    return
  }

  if (event.type === 'static') {
    runStaticEvent(event, context, payload)
  }
}

/**
 * 执行静态选项字段联动动作。
 *
 * @param action 静态字段联动动作配置。
 * @param context 当前渲染器运行时上下文。
 * @param payload 当前选中的完整选项。
 */
function runStaticEvent(action: StaticEventActionSchema, context: RuntimeContext, payload?: unknown): void {
  const scope = {
    $event: payload,
    event: payload,
  }

  for (const [path, value] of Object.entries(action.dependency)) {
    setByPath(context.state, path, resolveExpressionValue(value, context, scope))
  }

  context.services.notifyStateChange()
}

/**
 * 执行纯 JS 事件脚本。
 *
 * @param script 需要执行的事件脚本。
 * @param context 当前渲染器运行时上下文。
 * @param payload 事件触发时传入的数据。
 */
async function runScriptEvent(script: string, context: RuntimeContext, payload?: unknown): Promise<void> {
  const helpers = createEventHelpers(context, payload)

  const result = await runScript(script, {
    state: context.state,
    helpers,
    scope: {
      $event: payload,
      event: payload,
    },
    formatErrorMessage: ({ phase, message }) => `OpenPage script ${phase} error: ${message}`,
  })

  if (!result.ok) {
    context.services.message?.error?.(result.error?.message || 'OpenPage script error')
    return
  }

  if (result.patches.length > 0) {
    context.services.notifyStateChange()
  }
}

/**
 * 创建事件脚本可直接使用的内置函数。
 *
 * @param context 当前渲染器运行时上下文。
 * @param payload 事件触发时传入的数据。
 * @returns 返回事件脚本运行时内置函数。
 */
function createEventHelpers(context: RuntimeContext, payload?: unknown): EventRuntimeHelpers {
  return {
    ...valueRuntimeHelpers,
    $event: payload,
    event: payload,
    getComponentById: (id: string) => getComponentById(context, id),
    getComponentByName: (name: string) => getComponentByName(context, name),
    getState: (path: string) => getByPath(context.state, path),
    message: context.services.message || {},
    resetForm: async () => await runFormServiceAction(context, 'reset'),
    setState: (path: string, value: unknown) => {
      setByPath(context.state, path, value)
      context.services.notifyStateChange()
    },
    submitForm: async () => await runFormServiceAction(context, 'submit'),
    updateComponentById: (id: string, patch: RuntimeComponentPatch) => updateComponentById(context, id, patch),
    updateComponentByName: (name: string, patch: RuntimeComponentPatch) => updateComponentByName(context, name, patch),
  }
}

/**
 * 执行表单服务动作。
 *
 * @param context 当前渲染器运行时上下文。
 * @param actionName 表单服务动作名称。
 * @returns 返回动作是否执行通过。
 */
async function runFormServiceAction(context: RuntimeContext, actionName: keyof NonNullable<RuntimeContext['services']['form']>): Promise<boolean> {
  const action = context.services.form?.[actionName]

  if (!action) {
    context.services.message?.warning?.('当前页面未配置表单校验能力')
    return false
  }

  const result = await action()

  if (actionName !== 'submit') {
    return Boolean(result)
  }

  return handleSubmitFormResult(context, result)
}

/**
 * 处理表单提交校验结果。
 *
 * @param context 当前渲染器运行时上下文。
 * @param result 表单服务返回结果。
 * @returns 返回表单是否校验通过。
 */
function handleSubmitFormResult(context: RuntimeContext, result: boolean | RuntimeFormSubmitResult): boolean {
  if (typeof result === 'boolean') {
    return result
  }

  if (!result.valid && result.message) {
    context.services.message?.error?.(result.message)
  }

  return result.valid
}
