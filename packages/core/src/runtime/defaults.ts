import type { CompiledComponent } from '../types/compiled'
import type { RuntimeContext } from '../types/runtime'
import { getByPath, setByPath } from '../utils/path'
import { resolveExpressionValue } from './expression'

/**
 * 应用所有组件的默认值配置。
 *
 * @param context 当前渲染器运行时上下文。
 */
export function applyComponentDefaultValues(context: RuntimeContext): void {
  let changed = false

  for (const component of context.compiled.components.values()) {
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

  if (!isEmptyDefaultTarget(getByPath(context.state, component.model.path))) {
    return false
  }

  setByPath(context.state, component.model.path, resolveExpressionValue(component.defaultValue, context))
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
