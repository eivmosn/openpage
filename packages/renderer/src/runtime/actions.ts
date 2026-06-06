import type { CompiledNode } from '../types/compiled'
import type { RendererContext, RuntimeNodePatch } from '../types/runtime'
import type { EventSchema, StaticEventActionSchema } from '../types/schema'
import type { ValueRuntimeHelpers } from './helpers'
import { getCachedValue } from '../utils/cache'
import { getByPath, setByPath } from '../utils/path'
import { evaluateValue } from './expression'
import { valueRuntimeHelpers } from './helpers'
import { getNodeById, getNodeByName, updateNodeById, updateNodeByName } from './nodes'

export interface EventRuntimeHelpers extends ValueRuntimeHelpers {
  $event: unknown
  event: unknown
  getNodeById: (id: string) => CompiledNode | undefined
  getNodeByName: (name: string) => CompiledNode | undefined
  getState: (path: string) => unknown
  message: NonNullable<RendererContext['platform']['message']>
  setState: (path: string, value: unknown) => void
  submitForm: (name: string) => Promise<unknown>
  updateNodeById: (id: string, patch: RuntimeNodePatch) => boolean
  updateNodeByName: (name: string, patch: RuntimeNodePatch) => boolean
}

type ScriptRunner = (state: Record<string, unknown>, helpers: EventRuntimeHelpers) => Promise<unknown>

const scriptCache = new Map<string, ScriptRunner>()

/**
 * 执行节点事件配置。
 *
 * @param event 需要执行的事件配置。
 * @param context 当前渲染器运行时上下文。
 * @param payload 事件触发时传入的数据。
 */
export async function runActions(event: EventSchema | undefined, context: RendererContext, payload?: unknown): Promise<void> {
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
function runStaticEvent(action: StaticEventActionSchema, context: RendererContext, payload?: unknown): void {
  const scope = {
    $event: payload,
    event: payload,
  }

  for (const [path, value] of Object.entries(action.dependency)) {
    setByPath(context.state, path, evaluateValue(value, context, scope))
  }

  context.notifyStateChange()
}

/**
 * 执行纯 JS 事件脚本。
 *
 * @param script 需要执行的事件脚本。
 * @param context 当前渲染器运行时上下文。
 * @param payload 事件触发时传入的数据。
 */
async function runScriptEvent(script: string, context: RendererContext, payload?: unknown): Promise<void> {
  const helpers = createEventHelpers(context, payload)

  const runScript = getCachedValue(scriptCache, script, () => compileScript(script))
  try {
    await runScript(context.state, helpers)
  }
  finally {
    context.notifyStateChange()
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
function createEventHelpers(context: RendererContext, payload?: unknown): EventRuntimeHelpers {
  return {
    ...valueRuntimeHelpers,
    $event: payload,
    event: payload,
    getNodeById: (id: string) => getNodeById(context, id),
    getNodeByName: (name: string) => getNodeByName(context, name),
    getState: (path: string) => getByPath(context.state, path),
    message: context.platform.message || {},
    setState: (path: string, value: unknown) => {
      setByPath(context.state, path, value)
      context.notifyStateChange()
    },
    submitForm: (name: string) => submitNamedForm(context, name),
    updateNodeById: (id: string, patch: RuntimeNodePatch) => updateNodeById(context, id, patch),
    updateNodeByName: (name: string, patch: RuntimeNodePatch) => updateNodeByName(context, name, patch),
  }
}

/**
 * 触发指定表单的提交校验事件。
 *
 * @param context 当前渲染器运行时上下文。
 * @param name 需要提交的表单名称。
 * @returns 返回表单提交事件执行结果。
 */
async function submitNamedForm(context: RendererContext, name: string): Promise<unknown> {
  return await context.eventHandlers.get(name)?.get('submit')?.()
}
