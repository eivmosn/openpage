import type { CompiledComponent } from '../types/compiled'
import { defineComponent, h } from 'vue'
import { runActions } from '../runtime/actions'
import { resolveRuntimeComponent } from '../runtime/components'
import { getModelValue, setModelValue } from '../runtime/model'
import { usePageContext } from '../runtime/vue/usePageContext'

const renderedComponentCache = new WeakMap<CompiledComponent, CompiledComponent>()

export const Component = defineComponent({
  name: 'OpenPageComponent',
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const context = usePageContext()
    let cachedChildren: CompiledComponent['children'] | undefined
    let cachedChildrenVNodes: unknown
    let latestRuntimeComponent: CompiledComponent | undefined

    /**
     * 触发当前组件配置的事件动作。
     *
     * @param eventName 需要触发的事件名称。
     * @param payload 事件携带的数据。
     */
    function emitComponentEvent(eventName: string, payload?: unknown): Promise<void> {
      return runActions(latestRuntimeComponent?.events[eventName], context, payload)
    }

    /**
     * 读取当前运行时组件。
     *
     * @returns 返回合并运行时 patch 后的组件。
     */
    function resolveCurrentComponent(): CompiledComponent {
      const compiledComponent = context.compiled.components.get(props.id)

      if (!compiledComponent) {
        throw new Error(`[openpage] component not found: ${props.id}`)
      }

      return resolveRuntimeComponent(context, compiledComponent)
    }

    /**
     * 创建可传给 UI 组件的渲染组件配置。
     *
     * @param currentComponent 当前运行时组件。
     * @returns 返回已计算动态字段和动态 props 的组件配置。
     */
    function resolveRenderedComponent(currentComponent: CompiledComponent): CompiledComponent {
      if (currentComponent.dynamic.fields.length === 0 && currentComponent.dynamicProps.length === 0) {
        return resolveCachedRenderedComponent(currentComponent)
      }

      const dynamicValues = resolveComponentDynamicValues(currentComponent)

      return {
        ...currentComponent,
        ...dynamicValues,
        dynamicValues,
        props: evaluateComponentProps(currentComponent),
      }
    }

    /**
     * 读取静态组件的缓存渲染配置。
     *
     * @param currentComponent 当前运行时组件。
     * @returns 返回复用的静态渲染组件配置。
     */
    function resolveCachedRenderedComponent(currentComponent: CompiledComponent): CompiledComponent {
      const cachedComponent = renderedComponentCache.get(currentComponent)

      if (cachedComponent) {
        return cachedComponent
      }

      const renderedComponent = {
        ...currentComponent,
        props: currentComponent.staticProps,
      }

      renderedComponentCache.set(currentComponent, renderedComponent)
      return renderedComponent
    }

    /**
     * 计算组件运行时 props。
     *
     * @param currentComponent 当前编译组件。
     * @returns 返回已计算展示表达式的 props。
     */
    function evaluateComponentProps(currentComponent: CompiledComponent): Record<string, unknown> {
      if (currentComponent.dynamicProps.length === 0) {
        return currentComponent.staticProps
      }

      const props = { ...currentComponent.staticProps }

      for (const [key, resolveValue] of currentComponent.dynamicProps) {
        props[key] = resolveValue(context)
      }

      return props
    }

    /**
     * 解析组件可配置动态字段，静态字段直接复用原值。
     *
     * @param currentComponent 当前编译组件。
     * @returns 返回解析后的动态字段值。
     */
    function resolveComponentDynamicValues(currentComponent: CompiledComponent): Record<string, unknown> {
      const dynamicValues: Record<string, unknown> = {}

      for (const field of currentComponent.dynamic.fields) {
        const resolveValue = currentComponent.dynamicResolvers[field]
        dynamicValues[field] = resolveValue(context)
      }

      return dynamicValues
    }

    /**
     * 渲染当前组件的子组件。
     *
     * @returns 返回 Vue 子组件数组。
     */
    function renderChildren(component: CompiledComponent): unknown {
      const children = component.children

      if (cachedChildren === children) {
        return cachedChildrenVNodes
      }

      cachedChildren = children
      cachedChildrenVNodes = children.map(childId =>
        h(Component, {
          key: childId,
          id: childId,
        }),
      )

      return cachedChildrenVNodes
    }

    /**
     * 创建当前 UI 组件的公共属性。
     *
     * @returns 返回 UI 组件接收的组件属性。
     */
    function resolveComponentProps(runtimeComponent: CompiledComponent, renderedComponent: CompiledComponent) {
      return {
        component: renderedComponent,
        context,
        value: runtimeComponent.model ? getModelValue(context.state, runtimeComponent.model) : undefined,
        emitComponentEvent,
        updateModelValue,
      }
    }

    /**
     * 更新组件模型对应的页面状态。
     *
     * @param value 组件上报的新值。
     */
    function updateModelValue(value: unknown): void {
      if (!latestRuntimeComponent?.model) {
        return
      }

      setModelValue(context.state, latestRuntimeComponent.model, value)
      context.services.notifyStateChange()
    }

    return () => {
      const runtimeComponent = resolveCurrentComponent()
      latestRuntimeComponent = runtimeComponent
      const renderedComponent = resolveRenderedComponent(runtimeComponent)

      if (runtimeComponent.visible !== undefined && !renderedComponent.visible) {
        return null
      }

      const component = context.components[renderedComponent.type]

      if (!component) {
        return h('div', { class: 'openpage-missing-component' }, `Missing component type: ${renderedComponent.type}`)
      }

      return h(component, resolveComponentProps(runtimeComponent, renderedComponent), {
        default: () => renderChildren(runtimeComponent),
      })
    }
  },
})
