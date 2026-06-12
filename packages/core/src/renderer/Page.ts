import type { CSSProperties, PropType } from 'vue'
import type { PageContext, PagePlatform } from '../types/page'
import type { PageSchema } from '../types/schema'
import type { OpenPageComponents } from '../types/ui'
import { computed, defineComponent, h, markRaw, shallowRef, toRaw, watch } from 'vue'
import { compileSchema } from '../compiler/compileSchema'
import { usePageInteractionStyles } from '../interactions/usePageInteractionStyles'
import { createPageContext, updatePageSchema, updatePageState } from '../runtime/vue/createPageContext'
import { useComputedValues } from '../runtime/vue/useComputedValues'
import { providePageContext } from '../runtime/vue/usePageContext'
import { formWrapperKey } from '../types/ui'
import { Component } from './Component'

const missingComponentsMessage = 'OpenPage Renderer 渲染失败：未配置 UI 组件映射，请通过 components 属性传入组件表。'
const missingFormWrapperMessage = '[openpage] 未配置 formWrapper，页面将无法使用组件库表单校验。OpenPage 当前依赖第三方 UI 组件库的 Form 能力进行验证，以避免重复实现校验逻辑；如需校验，请在 components 中提供 formWrapper。'
const pageRootStyle: CSSProperties = {
  boxSizing: 'border-box',
  height: '100%',
  minHeight: 0,
  minWidth: 0,
  width: '100%',
}

const PageProvider = defineComponent({
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
    components: {
      type: Object as PropType<OpenPageComponents>,
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
    let cachedRootChildren: string[] | undefined
    let cachedRootChildrenVNodes: unknown
    let hasWarnedMissingFormWrapper = false

    usePageInteractionStyles(compiled)

    const context = shallowRef<PageContext>()
    useComputedValues(context)

    /**
     * 将当前运行时状态同步给外部受控状态。
     */
    function notifyStateChange(): void {
      emit('update:state', toRaw(context.value?.state || props.state))
    }

    watch(() => props.components, (components) => {
      if (!components) {
        context.value = undefined
        return
      }

      if (!context.value) {
        context.value = createPageContext(compiled.value, props.state, components, props.platform, notifyStateChange)
        return
      }

      context.value.components = components
      context.value.services.message = props.platform.message
    }, {
      immediate: true,
    })

    watch(compiled, (latestCompiled) => {
      cachedRootChildren = undefined
      cachedRootChildrenVNodes = undefined

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
        return renderPageRoot(missingComponentsMessage, {
          'data-openpage-renderer-error': 'missing-components',
          'role': 'alert',
        })
      }

      return renderPageRoot(
        h(PageProvider, { context: runtimeContext }, {
          default: () => renderPageContent(runtimeContext),
        }),
      )
    }

    /**
     * 渲染页面根容器，保证 Page 在任意宿主内默认占满父级。
     *
     * @param children 页面根容器的子内容。
     * @param attrs 页面根容器需要追加的属性。
     * @returns 返回带有稳定尺寸约束的页面根节点。
     */
    function renderPageRoot(children: ReturnType<typeof h> | string, attrs: Record<string, unknown> = {}): unknown {
      return h('div', {
        ...attrs,
        class: 'openpage-page',
        style: pageRootStyle,
      }, children)
    }

    /**
     * 渲染页面内容，并允许 UI 适配层挂载表单包装器。
     *
     * @param runtimeContext 当前页面运行时上下文。
     * @returns 返回页面内容 VNode。
     */
    function renderPageContent(runtimeContext: PageContext): unknown {
      const children = renderRootChildren(runtimeContext.compiled.children)
      const formWrapper = runtimeContext.components[formWrapperKey]

      if (!formWrapper) {
        warnMissingFormWrapper()
        return children
      }

      return h(formWrapper, { context: runtimeContext }, {
        default: () => children,
      })
    }

    /**
     * 提示调用方补齐表单包装器，否则无法复用第三方组件库校验能力。
     */
    function warnMissingFormWrapper(): void {
      if (hasWarnedMissingFormWrapper) {
        return
      }

      hasWarnedMissingFormWrapper = true
      console.warn(missingFormWrapperMessage)
    }

    /**
     * 渲染页面顶层组件，并在结构未变化时复用 VNode 数组。
     *
     * @param children 当前页面顶层组件 id 列表。
     * @returns 返回页面顶层组件 VNode 数组。
     */
    function renderRootChildren(children: string[]): unknown {
      if (cachedRootChildren === children) {
        return cachedRootChildrenVNodes
      }

      cachedRootChildren = children
      cachedRootChildrenVNodes = children.map(id =>
        h(Component, {
          key: id,
          id,
        }),
      )

      return cachedRootChildrenVNodes
    }
  },
})
