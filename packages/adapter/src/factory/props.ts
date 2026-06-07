import type { PropType } from 'vue'
import type { UiComponentProps } from '../types'

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
    required: false,
  },
  emitComponentEvent: {
    type: Function as PropType<UiComponentProps['emitComponentEvent']>,
    required: true,
  },
  emitNamedComponentEvent: {
    type: Function as PropType<UiComponentProps['emitNamedComponentEvent']>,
    required: true,
  },
  updateModelValue: {
    type: Function as PropType<UiComponentProps['updateModelValue']>,
    required: true,
  },
}
