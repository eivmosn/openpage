import type { UiNodeProps } from '../types'
import type { CreateButtonComponentOptions } from './types'
import { defineComponent, h } from 'vue'
import { uiNodeProps } from './props'

/**
 * 创建触发节点事件的通用按钮组件。
 *
 * @param options UI 按钮组件及点击事件、文本和属性解析配置。
 * @returns 返回可注册到适配器组件映射中的 Vue 组件。
 */
export function createButtonComponent(options: CreateButtonComponentOptions) {
  const clickEvent = options.clickEvent || 'onClick'
  const nodeEvent = options.nodeEvent || 'onclick'
  const disabledProp = options.disabledProp === undefined ? 'disabled' : options.disabledProp

  return defineComponent({
    name: options.name || 'OpenPageAdapterButton',
    props: uiNodeProps,
    setup(rawProps) {
      const props = rawProps as UiNodeProps

      /**
       * 触发按钮节点配置的点击动作。
       */
      async function handleClick(): Promise<void> {
        await props.emitNodeEvent(nodeEvent)
      }

      return () => {
        const componentProps: Record<string, unknown> = {
          ...props.node.props,
          ...options.resolveProps?.(props),
          [clickEvent]: handleClick,
        }

        if (disabledProp) {
          componentProps[disabledProp] = props.node.disabled === true || props.node.props.disabled === true
        }

        const text = options.resolveText
          ? options.resolveText(props)
          : props.node.label || props.node.props.text || '按钮'

        return h(options.component, componentProps, () => text)
      }
    },
  })
}
