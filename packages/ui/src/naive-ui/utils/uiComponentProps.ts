import type { PropType } from 'vue'
import type { UiComponentProps } from '../../types'

/**
 * OpenPage UI 组件统一运行时 props 声明。
 *
 * @remarks
 * 高阶组件本身可能不直接消费 value，但必须完整透传给真实组件。
 * value 是当前组件模型值，字段组件会通过 useFormField 或 props.value 读取它。
 */
export const uiComponentProps = {
  component: {
    type: Object as PropType<UiComponentProps['component']>,
    required: true,
  },
  context: {
    type: Object as PropType<UiComponentProps['context']>,
    required: true,
  },
  value: {
    type: null,
    default: undefined,
  },
  emitComponentEvent: {
    type: Function as PropType<UiComponentProps['emitComponentEvent']>,
    required: true,
  },
  updateModelValue: {
    type: Function as PropType<UiComponentProps['updateModelValue']>,
    required: true,
  },
} as const
