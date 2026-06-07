import type { CompiledComponent } from '../types/compiled'
import type { RuntimeComponentPatch, RuntimeContext } from '../types/runtime'
import type { EventSchema, StaticEventActionSchema } from '../types/schema'
import type { ValueRuntimeHelpers } from './helpers'
import { getCachedValue } from '../utils/cache'
import { getByPath, setByPath } from '../utils/path'
import { getComponentById, getComponentByName, updateComponentById, updateComponentByName } from './components'
import { resolveExpressionValue } from './expression'
import { valueRuntimeHelpers } from './helpers'

export interface EventRuntimeHelpers extends ValueRuntimeHelpers {
  $event: unknown
  event: unknown
  getComponentById: (id: string) => CompiledComponent | undefined
  getComponentByName: (name: string) => CompiledComponent | undefined
  getState: (path: string) => unknown
  message: NonNullable<RuntimeContext['services']['message']>
  setState: (path: string, value: unknown) => void
  submitForm: (name: string) => Promise<unknown>
  updateComponentById: (id: string, patch: RuntimeComponentPatch) => boolean
  updateComponentByName: (name: string, patch: RuntimeComponentPatch) => boolean
}

type ScriptRunner = (state: Record<string, unknown>, helpers: EventRuntimeHelpers) => Promise<unknown>

const scriptCache = new Map<string, ScriptRunner>()

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

  const runScript = getCachedValue(scriptCache, script, () => compileScript(script))
  try {
    await runScript(context.state, helpers)
  }
  finally {
    context.services.notifyStateChange()
  }
}

/**
 * 编译事件脚本执行函数。
 *
 * @param script 当前事件脚本。
 * @returns 返回可复用的事件脚本执行函数。
 */
function compileScript(script: string): ScriptRunner {
  // eslint-disable-next-line no-new-func
  return new Function(
    'state',
    'helpers',
    `with (helpers) { with (state) { return (async () => { ${script}\n })() } }`,
  ) as ScriptRunner
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
    setState: (path: string, value: unknown) => {
      setByPath(context.state, path, value)
      context.services.notifyStateChange()
    },
    submitForm: async (name: string) => await context.services.submitForm?.(name),
    updateComponentById: (id: string, patch: RuntimeComponentPatch) => updateComponentById(context, id, patch),
    updateComponentByName: (name: string, patch: RuntimeComponentPatch) => updateComponentByName(context, name, patch),
  }
}
