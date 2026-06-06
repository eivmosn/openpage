import type { PropType } from 'vue'
import type { UiAdapter } from '../adapters/types'
import type { RendererContext, RendererPlatform } from '../types/runtime'
import type { PageSchema } from '../types/schema'
import { computed, defineComponent, h, markRaw, reactive } from 'vue'
import { compileSchema } from '../compiler/compileSchema'
import { usePageInteractionStyles } from '../interactions/usePageInteractionStyles'
import { createReactiveState } from '../runtime/context'
import { applyNodeDefaultValues } from '../runtime/defaults'
import { NodeRenderer } from './NodeRenderer'
import { Provider } from './Provider'

const missingAdapterMessage = 'OpenPage Renderer 渲染失败：未配置 UI Adapter，请通过 adapter 属性传入适配器。'

export const Renderer = defineComponent({
  name: 'OpenPageRenderer',
  props: {
    schema: {
      type: Object as PropType<PageSchema>,
      required: true,
    },
    adapter: {
      type: Object as PropType<UiAdapter>,
      default: undefined,
    },
    platform: {
      type: Object as PropType<RendererPlatform>,
      default: () => ({}),
    },
  },
  setup(props) {
    const schema = computed(() => props.schema)
    const compiled = computed(() => markRaw(compileSchema(schema.value)))

    usePageInteractionStyles(schema)

    const context = computed<RendererContext | undefined>(() => {
      if (!props.adapter)
        return undefined

      const runtimeContext: RendererContext = {
        compiled: compiled.value,
        state: createReactiveState(compiled.value.state),
        adapter: props.adapter,
        platform: props.platform,
        eventHandlers: markRaw(new Map()),
        nodePatches: reactive({}),
      }

      applyNodeDefaultValues(runtimeContext)

      return runtimeContext
    })

    return () => {
      const runtimeContext = context.value

      if (!runtimeContext) {
        return h('div', {
          'data-openpage-renderer-error': 'missing-adapter',
          'role': 'alert',
        }, missingAdapterMessage)
      }

      return h(Provider, { context: runtimeContext }, {
        default: () => runtimeContext.compiled.children.map(id =>
          h(NodeRenderer, {
            key: id,
            id,
          }),
        ),
      })
    }
  },
})
