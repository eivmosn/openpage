import type { ComputedRef } from 'vue'
import type { CompiledComponent } from '../../types/compiled'
import type { RuntimeContext } from '../../types/runtime'
import { computed } from 'vue'
import { getByPath, setByPath } from '../../utils/path'

export interface ComponentModelBinding {
  value: ComputedRef<unknown>
  updateValue: (value: unknown) => void
}

/**
 * 创建组件和页面状态之间的模型绑定。
 *
 * @param component 当前运行时组件引用。
 * @param context 当前渲染器运行时上下文。
 * @returns 返回模型值和更新函数。
 */
export function useComponentModel(component: ComputedRef<CompiledComponent>, context: RuntimeContext): ComponentModelBinding {
  const value = computed(() => {
    if (!component.value.model) {
      return undefined
    }

    return getByPath(context.state, component.value.model.path)
  })

  /**
   * 更新组件模型对应的页面状态。
   *
   * @param nextValue 组件上报的新值。
   */
  function updateValue(nextValue: unknown): void {
    if (!component.value.model) {
      return
    }

    setByPath(context.state, component.value.model.path, nextValue)
    context.services.notifyStateChange()
  }

  return {
    value,
    updateValue,
  }
}
