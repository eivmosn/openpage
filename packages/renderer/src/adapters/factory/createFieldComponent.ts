import type { UiNodeProps } from '../types'
import type { CreateFieldComponentOptions } from './types'
import { defineComponent, h } from 'vue'
import { uiNodeProps } from './props'

/**
 * 创建具备模型绑定能力的通用字段组件。
 *
 * @param options UI 组件及其值属性、更新事件和属性解析配置。
 * @returns 返回可注册到适配器组件映射中的 Vue 组件。
 */
export function createFieldComponent(options: CreateFieldComponentOptions) {
  const valueProp = options.valueProp || 'modelValue'
  const updateEvent = options.updateEvent || 'onUpdate:modelValue'
  const nodeEvent = options.nodeEvent === undefined ? 'onchange' : options.nodeEvent
  const disabledProp = options.disabledProp === undefined ? 'disabled' : options.disabledProp
  const placeholderProp = options.placeholderProp === undefined ? 'placeholder' : options.placeholderProp

  return defineComponent({
    name: options.name || 'OpenPageAdapterField',
    props: uiNodeProps,
    setup(rawProps, { slots }) {
      const props = rawProps as UiNodeProps

      /**
       * 处理 UI 组件上报的新值并同步 OpenPage 模型。
       *
       * @param args UI 组件更新事件携带的参数。
       */
      async function handleUpdate(...args: unknown[]): Promise<void> {
        const nextValue = options.resolveUpdateValue
          ? options.resolveUpdateValue(args, props)
          : args[0]

        props.updateModelValue(nextValue)

        if (nodeEvent) {
          await props.emitNodeEvent(nodeEvent, nextValue)
        }
      }

      /**
       * 解析当前字段需要传给 UI 组件的属性。
       *
       * @returns 返回合并后的 UI 组件属性。
       */
      function resolveComponentProps(): Record<string, unknown> {
        const componentProps: Record<string, unknown> = {
          ...props.node.props,
          ...options.resolveProps?.(props),
          [valueProp]: options.resolveValue ? options.resolveValue(props) : props.value,
          [updateEvent]: handleUpdate,
        }

        if (disabledProp) {
          componentProps[disabledProp] = props.node.disabled === true || props.node.props.disabled === true
        }

        if (placeholderProp && props.node.props.placeholder !== undefined) {
          componentProps[placeholderProp] = props.node.props.placeholder
        }

        return componentProps
      }

      return () => h(options.component, resolveComponentProps(), slots)
    },
  })
}
