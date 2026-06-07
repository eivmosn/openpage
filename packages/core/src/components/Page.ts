import type { PropType } from 'vue'
import type { UiAdapter } from '../types/adapter'
import type { PageContext, PagePlatform } from '../types/page'
import type { PageSchema } from '../types/schema'
import { computed, defineComponent, h, markRaw, shallowRef, toRaw, watch } from 'vue'
import { compileSchema } from '../compiler/compileSchema'
import { usePageInteractionStyles } from '../interactions/usePageInteractionStyles'
import { createPageContext, updatePageSchema, updatePageState } from '../runtime/vue/createPageContext'
import { useComputedValues } from '../runtime/vue/useComputedValues'
import { ComponentRenderer } from './ComponentRenderer'
import { PageProvider } from './PageProvider'

const missingAdapterMessage = 'OpenPage Renderer 渲染失败：未配置 UI Adapter，请通过 adapter 属性传入适配器。'

export const Page = defineComponent({
  name: 'OpenPage',
  emits: {
    'update:state': (_state: Record<string, unknown>) => true,
  },
  props: {
    schema: {
      type: Object as PropType<PageSchema>,
      required: true,
    },
    state: {
      type: Object as PropType<Record<string, unknown>>,
      default: () => ({}),
    },
    adapter: {
      type: Object as PropType<UiAdapter>,
      default: undefined,
    },
    platform: {
      type: Object as PropType<PagePlatform>,
      default: () => ({}),
    },
  },
  setup(props, { emit }) {
    const schema = computed(() => props.schema)
    const compiled = computed(() => markRaw(compileSchema(schema.value)))

    usePageInteractionStyles(schema)

    const context = shallowRef<PageContext>()
    useComputedValues(context)

    /**
     * 将当前运行时状态同步给外部受控状态。
     */
    function notifyStateChange(): void {
      emit('update:state', toRaw(context.value?.state || props.state))
    }

    watch(() => props.adapter, (adapter) => {
      if (!adapter) {
        context.value = undefined
        return
      }

      if (!context.value) {
        context.value = createPageContext(compiled.value, props.state, adapter, props.platform, notifyStateChange)
        return
      }

      context.value.adapter = adapter
      context.value.services.message = props.platform.message
    }, {
      immediate: true,
    })

    watch(compiled, (latestCompiled) => {
      if (context.value) {
        updatePageSchema(context.value, latestCompiled)
      }
    })

    watch(() => props.state, (state) => {
      if (context.value) {
        updatePageState(context.value, state)
      }
    })

    watch(() => props.platform, (platform) => {
      if (context.value) {
        context.value.services.message = platform.message
      }
    })

    return () => {
      const runtimeContext = context.value

      if (!runtimeContext) {
        return h('div', {
          'data-openpage-renderer-error': 'missing-adapter',
          'role': 'alert',
        }, missingAdapterMessage)
      }

      return h(PageProvider, { context: runtimeContext }, {
        default: () => runtimeContext.compiled.children.map(id =>
          h(ComponentRenderer, {
            key: id,
            id,
          }),
        ),
      })
    }
  },
})
