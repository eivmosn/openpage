import type { PropType } from 'vue'
import type { PageContext } from '../types/page'
import { defineComponent } from 'vue'
import { providePageContext } from '../runtime/vue/usePageContext'

export const PageProvider = defineComponent({
  name: 'OpenPageProvider',
  props: {
    context: {
      type: Object as PropType<PageContext>,
      required: true,
    },
  },
  setup(props, { slots }) {
    providePageContext(props.context)

    return () => slots.default?.()
  },
})
