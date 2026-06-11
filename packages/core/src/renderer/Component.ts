import type { CompiledComponent } from '../types/compiled'
import { computed, defineComponent, h } from 'vue'
import { runActions } from '../runtime/actions'
import { resolveRuntimeComponent } from '../runtime/components'
import { useComponentModel } from '../runtime/vue/useComponentModel'
import { usePageContext } from '../runtime/vue/usePageContext'

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

    const component = computed(() => {
      const compiledComponent = context.compiled.components.get(props.id)

      if (!compiledComponent) {
        throw new Error(`[openpage] component not found: ${props.id}`)
      }

      return compiledComponent
    })

    const runtimeComponent = computed(() => resolveRuntimeComponent(context, component.value))

    const renderedComponent = computed<CompiledComponent>(() => {
      const currentComponent = runtimeComponent.value
      const dynamicValues = resolveComponentDynamicValues(currentComponent)

      return {
        ...currentComponent,
        ...dynamicValues,
        dynamicValues,
        props: evaluateComponentProps(currentComponent),
      }
    })

    const model = useComponentModel(runtimeComponent, context)

    /**
     * 触发当前组件配置的事件动作。
     *
     * @param eventName 需要触发的事件名称。
     * @param payload 事件携带的数据。
     */
    function emitComponentEvent(eventName: string, payload?: unknown): Promise<void> {
      return runActions(runtimeComponent.value.events[eventName], context, payload)
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

      for (const field of currentComponent.dynamicFieldKeys) {
        const resolveValue = currentComponent.dynamicResolvers[field]
        dynamicValues[field] = resolveValue
          ? resolveValue(context)
          : currentComponent.dynamicValues[field]
      }

      return dynamicValues
    }

    /**
     * 判断当前组件是否允许渲染。
     *
     * @returns 返回当前组件是否可见。
     */
    function isComponentVisible(): boolean {
      if (runtimeComponent.value.visible === undefined) {
        return true
      }

      return Boolean(renderedComponent.value.visible)
    }

    /**
     * 渲染当前组件的子组件。
     *
     * @returns 返回 Vue 子组件数组。
     */
    function renderChildren(): unknown {
      const children = runtimeComponent.value.children

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
    function resolveComponentProps() {
      return {
        component: renderedComponent.value,
        context,
        value: model.value.value,
        emitComponentEvent,
        updateModelValue: model.updateValue,
      }
    }

    return () => {
      if (!isComponentVisible()) {
        return null
      }

      const component = context.components[renderedComponent.value.type]

      if (!component) {
        return h('div', { class: 'openpage-missing-component' }, `Missing component type: ${renderedComponent.value.type}`)
      }

      return h('div', {
        'class': ['openpage-component', renderedComponent.value.interactionClassName],
        'data-openpage-component-id': renderedComponent.value.id,
        'data-openpage-component-type': renderedComponent.value.type,
      }, [
        h(component, resolveComponentProps(), {
          default: renderChildren,
        }),
      ])
    }
  },
})
