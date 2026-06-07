import type { CompiledComponent } from '../types/compiled'
import { computed, defineComponent, h } from 'vue'
import { createInteractionClassName, omitInteractionProps } from '../interactions/css'
import { runActions } from '../runtime/actions'
import { resolveRuntimeComponent } from '../runtime/components'
import { resolveExpressionValue } from '../runtime/expression'
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

    const component = computed(() => {
      const compiledComponent = context.compiled.components.get(props.id)

      if (!compiledComponent) {
        throw new Error(`[openpage] component not found: ${props.id}`)
      }

      return compiledComponent
    })

    const runtimeComponent = computed(() => resolveRuntimeComponent(context, component.value))

    const renderedComponent = computed<CompiledComponent>(() => ({
      ...runtimeComponent.value,
      label: resolveExpressionValue(runtimeComponent.value.label, context) as string | undefined,
      visible: resolveExpressionValue(runtimeComponent.value.visible, context),
      disabled: resolveExpressionValue(runtimeComponent.value.disabled, context),
      required: resolveExpressionValue(runtimeComponent.value.required, context),
      defaultValue: resolveExpressionValue(runtimeComponent.value.defaultValue, context),
      computedValue: runtimeComponent.value.computedValue,
      props: evaluateComponentProps(runtimeComponent.value),
    }))

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
      const evaluatedProps = Object.fromEntries(
        Object.entries(currentComponent.props).map(([key, value]) => [
          key,
          resolveExpressionValue(value, context),
        ]),
      )

      return omitInteractionProps(evaluatedProps)
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
      return runtimeComponent.value.children.map(childId =>
        h(Component, {
          key: childId,
          id: childId,
        }),
      )
    }

    /**
     * 创建当前组件组件的公共属性。
     *
     * @returns 返回适配器组件接收的组件属性。
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

      const component = context.adapter.components[renderedComponent.value.type]

      if (!component) {
        return h('div', { class: 'openpage-missing-component' }, `Missing component type: ${renderedComponent.value.type}`)
      }

      const componentProps = resolveComponentProps()
      const interactionClass = createInteractionClassName(context.compiled.id, renderedComponent.value.id)

      if (!renderedComponent.value.model || !context.adapter.formItem) {
        return h(component, {
          ...componentProps,
          class: interactionClass,
        }, {
          default: renderChildren,
        })
      }

      const componentVNode = h(component, componentProps, {
        default: renderChildren,
      })

      return h(context.adapter.formItem, {
        ...componentProps,
        class: interactionClass,
      }, {
        default: () => componentVNode,
      })
    }
  },
})
