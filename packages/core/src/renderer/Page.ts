import type { CSSProperties, PropType, Component as VueComponent } from 'vue'
import type { PageContext } from '../types/page'
import type { RuntimeClosePageService, RuntimeContextValue, RuntimeParentPageContext } from '../types/runtime'
import type { PageSchema } from '../types/schema'
import type { OpenPageComponents } from '../types/ui'
import { OverlayProvider } from '@openpage/overlay'
import { computed, defineComponent, getCurrentInstance, h, markRaw, shallowRef, watch } from 'vue'
import { compileSchema } from '../compiler/compileSchema'
import { usePageInteractionStyles } from '../interactions/usePageInteractionStyles'
import { runPageScript } from '../runtime/actions'
import { createOpenPageRuntime, provideOpenPageRuntime, useOpenPageRuntime } from '../runtime/page/runtime'
import { createPageContext, updatePageRuntimeOptions, updatePageSchema } from '../runtime/vue/createPageContext'
import { useComputedValues } from '../runtime/vue/useComputedValues'
import { providePageContext } from '../runtime/vue/usePageContext'
import { Component } from './Component'
import '@openpage/overlay/style.css'

const missingComponentsMessage = 'OpenPage Renderer 渲染失败：未配置 UI 组件映射，请通过 components 属性传入组件表。'
const missingFormMessage = '[openpage] 未配置 form 组件，页面将无法使用表单校验能力。'
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

const RuntimeProvider = defineComponent({
  name: 'OpenPageRuntimeProvider',
  props: {
    runtime: {
      type: Object as PropType<ReturnType<typeof createOpenPageRuntime>>,
      required: true,
    },
  },
  setup(props, { slots }) {
    provideOpenPageRuntime(props.runtime)

    return () => slots.default?.()
  },
})

export const Page = defineComponent({
  name: 'OpenPage',
  props: {
    schema: {
      type: Object as PropType<PageSchema>,
      required: true,
    },
    initState: {
      type: Object as PropType<Record<string, unknown>>,
      default: () => ({}),
    },
    components: {
      type: Object as PropType<OpenPageComponents>,
      default: undefined,
    },
    ctx: {
      type: Object as PropType<RuntimeContextValue>,
      default: () => ({}),
    },
    params: {
      type: Object as PropType<Record<string, unknown>>,
      default: () => ({}),
    },
    parent: {
      type: Object as PropType<RuntimeParentPageContext>,
      default: undefined,
    },
    closePage: {
      type: Function as PropType<RuntimeClosePageService>,
      default: undefined,
    },
  },
  setup(props) {
    const parentRuntime = useOpenPageRuntime()
    const pageComponent = markRaw(getCurrentInstance()?.type as VueComponent)
    const runtime = parentRuntime ?? createOpenPageRuntime({
      components: props.components,
      pageComponent,
    })
    const schema = computed(() => props.schema)
    const compiled = computed(() => markRaw(compileSchema(schema.value)))
    let cachedRootChildren: string[] | undefined
    let cachedRootChildrenVNodes: unknown
    let hasWarnedMissingForm = false
    let hasInitializedState = false

    usePageInteractionStyles(compiled)

    const context = shallowRef<PageContext>()
    useComputedValues(context)

    watch(() => props.components, (components) => {
      if (!components) {
        context.value = undefined
        return
      }

      if (!context.value) {
        context.value = createPageContext(
          compiled.value,
          createInitialState(),
          markRaw(components),
          createRuntimeOptions(),
        )
        void runInitPage()
        return
      }

      context.value.components = markRaw(components)
      updatePageRuntimeOptions(context.value, createRuntimeOptions())
    }, {
      immediate: true,
    })

    watch(compiled, (latestCompiled) => {
      cachedRootChildren = undefined
      cachedRootChildrenVNodes = undefined

      if (context.value) {
        updatePageSchema(context.value, latestCompiled)
        void runInitPage()
      }
    })

    watch(() => [props.ctx, props.params, props.parent, props.closePage] as const, () => {
      if (context.value) {
        updatePageRuntimeOptions(context.value, createRuntimeOptions())
      }
    })

    watch(() => props.components, () => {
      runtime.update({
        components: props.components,
        pageComponent,
      })
    }, {
      immediate: true,
    })

    return () => {
      const runtimeContext = context.value

      if (!runtimeContext) {
        return renderPageRoot(missingComponentsMessage, {
          'data-openpage-renderer-error': 'missing-components',
          'role': 'alert',
        })
      }

      const pageNode = renderPageRoot(
        h(PageProvider, { context: runtimeContext }, {
          default: () => renderPageContent(runtimeContext),
        }),
      )

      if (parentRuntime) {
        return pageNode
      }

      return h(RuntimeProvider, { runtime }, {
        default: () => h(OverlayProvider, null, {
          default: () => pageNode,
        }),
      })
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
     * 渲染页面内容，并挂载官方表单组件。
     *
     * @param runtimeContext 当前页面运行时上下文。
     * @returns 返回页面内容 VNode。
     */
    function renderPageContent(runtimeContext: PageContext): unknown {
      const children = renderRootChildren(runtimeContext.compiled.children)
      const Form = runtimeContext.components.form

      if (!Form) {
        warnMissingForm()
        return children
      }

      return h(Form, { context: runtimeContext }, {
        default: () => children,
      })
    }

    /**
     * 提示调用方补齐官方表单组件。
     */
    function warnMissingForm(): void {
      if (hasWarnedMissingForm) {
        return
      }

      hasWarnedMissingForm = true
      console.warn(missingFormMessage)
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

    /**
     * 创建页面初始状态，保证 initState 只在页面实例初始化时读取一次。
     *
     * @returns 返回当前页面的初始状态副本。
     */
    function createInitialState(): Record<string, unknown> {
      if (hasInitializedState) {
        return {}
      }

      hasInitializedState = true
      return { ...props.initState }
    }

    /**
     * 创建当前页面运行时选项。
     *
     * @returns 返回当前页面运行时选项。
     */
    function createRuntimeOptions(): Parameters<typeof createPageContext>[3] {
      return {
        closePage: props.closePage,
        ctx: props.ctx,
        openPage: runtime.openPage,
        params: props.params,
        parent: props.parent,
      }
    }

    /**
     * 执行当前页面的初始化生命周期脚本。
     */
    async function runInitPage(): Promise<void> {
      if (!context.value) {
        return
      }

      await runPageScript(schema.value.initPage, context.value)
    }
  },
})
