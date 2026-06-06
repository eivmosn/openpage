import type { ComputedRef } from 'vue'
import type { CompiledNode } from '../types/compiled'
import type { RendererContext } from '../types/runtime'
import { computed } from 'vue'
import { getByPath, setByPath } from '../utils/path'

export interface NodeModelBinding {
  value: ComputedRef<unknown>
  updateValue: (value: unknown) => void
}

/**
 * 创建节点和页面状态之间的模型绑定。
 *
 * @param node 当前运行时节点引用。
 * @param context 当前渲染器运行时上下文。
 * @returns 返回模型值和更新函数。
 */
export function useNodeModel(node: ComputedRef<CompiledNode>, context: RendererContext): NodeModelBinding {
  const value = computed(() => {
    if (!node.value.model) {
      return undefined
    }

    return getByPath(context.state, node.value.model.path)
  })

  /**
   * 更新节点模型对应的页面状态。
   *
   * @param nextValue 组件上报的新值。
   */
  function updateValue(nextValue: unknown): void {
    if (!node.value.model) {
      return
    }

    setByPath(context.state, node.value.model.path, nextValue)
  }

  return {
    value,
    updateValue,
  }
}
