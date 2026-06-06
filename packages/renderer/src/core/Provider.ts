import type { PropType } from 'vue'
import type { RendererContext } from '../types/runtime'
import { defineComponent } from 'vue'
import { provideRendererContext } from '../runtime/context'

export const Provider = defineComponent({
  name: 'OpenPageProvider',
  props: {
    context: {
      type: Object as PropType<RendererContext>,
      required: true,
    },
  },
  setup(props, { slots }) {
    provideRendererContext(props.context)

    return () => slots.default?.()
  },
})
