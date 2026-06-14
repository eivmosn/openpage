import type { RuntimeContext } from '../types/runtime'
import type { EventSchema, StaticEventActionSchema } from '../types/schema'
import { runScript } from '@openpage/script-runner'
import { readonly } from 'vue'
import { setByPath } from '../utils/path'
import { resolveExpressionValue } from './expression'

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
    ctx: readonly(context.ctx),
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
  const result = await runScript(script, {
    state: context.state,
    scope: {
      $event: payload,
      ctx: readonly(context.ctx),
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
 * 执行页面生命周期脚本。
 *
 * @param script 需要执行的页面生命周期脚本。
 * @param context 当前渲染器运行时上下文。
 */
export async function runPageScript(script: string | undefined, context: RuntimeContext): Promise<void> {
  if (!script?.trim()) {
    return
  }

  await runScriptEvent(script, context)
}
