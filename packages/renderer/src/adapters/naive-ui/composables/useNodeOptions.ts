import type { SelectOption } from 'naive-ui'
import type { ComputedRef } from 'vue'
import type { UiNodeProps } from '../../types'
import { computed } from 'vue'

/**
 * 创建节点 options 配置绑定。
 *
 * @param props 当前 UI 节点组件 props。
 * @returns 返回标准化后的选项列表。
 */
export function useNodeOptions(props: UiNodeProps): ComputedRef<SelectOption[]> {
  return computed(() => {
    const rawOptions = props.node.props.options

    if (!Array.isArray(rawOptions)) {
      return []
    }

    return rawOptions.filter(isSelectOption)
  })
}

/**
 * 判断配置项是否为合法选项。
 *
 * @param option 需要判断的选项配置。
 * @returns 返回是否为合法选项。
 */
function isSelectOption(option: unknown): option is SelectOption {
  return option !== null && typeof option === 'object' && 'label' in option && 'value' in option
}
