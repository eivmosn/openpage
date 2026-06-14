import type { CompiledComponent } from '../types/compiled'
import type { RuntimeContext } from '../types/runtime'
import { resolveExpressionValue } from './expression'
import { getModelValue, setModelValue } from './model'

/**
 * 应用所有组件的默认值配置。
 *
 * @param context 当前渲染器运行时上下文。
 */
export function applyComponentDefaultValues(context: RuntimeContext): void {
  let changed = false

  for (const component of context.compiled.defaultValueComponents) {
    changed = applyComponentDefaultValue(context, component) || changed
  }

  if (changed) {
    context.services.notifyStateChange()
  }
}

/**
 * 应用单个组件的默认值配置。
 *
 * @param context 当前渲染器运行时上下文。
 * @param component 当前编译组件。
 * @returns 返回是否写入了默认值。
 */
function applyComponentDefaultValue(context: RuntimeContext, component: CompiledComponent): boolean {
  if (!component.model || component.defaultValue === undefined) {
    return false
  }

  if (!isEmptyDefaultTarget(getModelValue(context.state, component.model))) {
    return false
  }

  setModelValue(context.state, component.model, resolveExpressionValue(component.defaultValue, context))
  return true
}

/**
 * 判断模型当前值是否允许写入默认值。
 *
 * @param value 当前模型值。
 * @returns 返回是否允许写入默认值。
 */
function isEmptyDefaultTarget(value: unknown): boolean {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)
}
