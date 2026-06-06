import type { PropType } from 'vue'
import type { UiNodeProps } from '../types'

export const uiNodeProps = {
  node: {
    type: Object as PropType<UiNodeProps['node']>,
    required: true,
  },
  context: {
    type: Object as PropType<UiNodeProps['context']>,
    required: true,
  },
  value: {
    required: false,
  },
  emitNodeEvent: {
    type: Function as PropType<UiNodeProps['emitNodeEvent']>,
    required: true,
  },
  emitNamedNodeEvent: {
    type: Function as PropType<UiNodeProps['emitNamedNodeEvent']>,
    required: true,
  },
  updateModelValue: {
    type: Function as PropType<UiNodeProps['updateModelValue']>,
    required: true,
  },
}
