import type { CompiledNode } from '../types/compiled'
import type { RendererContext } from '../types/runtime'
import { getByPath, setByPath } from '../utils/path'
import { evaluateValue } from './expression'

/**
 * 应用所有节点的默认值配置。
 *
 * @param context 当前渲染器运行时上下文。
 */
export function applyNodeDefaultValues(context: RendererContext): void {
  for (const node of context.compiled.nodes.values()) {
    applyNodeDefaultValue(context, node)
  }
}

/**
 * 应用单个节点的默认值配置。
 *
 * @param context 当前渲染器运行时上下文。
 * @param node 当前编译节点。
 */
function applyNodeDefaultValue(context: RendererContext, node: CompiledNode): void {
  if (!node.model || node.defaultValue === undefined) {
    return
  }

  if (!isEmptyDefaultTarget(getByPath(context.state, node.model.path))) {
    return
  }

  setByPath(context.state, node.model.path, evaluateValue(node.defaultValue, context))
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
