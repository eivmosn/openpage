import type { UiComponentProps } from '../types'
import type { CreateButtonComponentOptions } from './types'
import { defineComponent, h } from 'vue'
import { uiComponentProps } from './props'

/**
 * 创建触发组件事件的通用按钮组件。
 *
 * @param options UI 按钮组件及点击事件、文本和属性解析配置。
 * @returns 返回可注册到适配器组件映射中的 Vue 组件。
 */
export function createButtonComponent(options: CreateButtonComponentOptions) {
  const clickEvent = options.clickEvent || 'onClick'
  const componentEvent = options.componentEvent || 'onclick'
  const disabledProp = options.disabledProp === undefined ? 'disabled' : options.disabledProp

  return defineComponent({
    name: options.name || 'OpenPageAdapterButton',
    props: uiComponentProps,
    setup(rawProps) {
      const props = rawProps as UiComponentProps

      /**
       * 触发按钮组件配置的点击动作。
       */
      async function handleClick(): Promise<void> {
        await props.emitComponentEvent(componentEvent)
      }

      return () => {
        const componentProps: Record<string, unknown> = {
          ...props.component.props,
          ...options.resolveProps?.(props),
          [clickEvent]: handleClick,
        }

        if (disabledProp) {
          componentProps[disabledProp] = props.component.disabled === true || props.component.props.disabled === true
        }

        const text = options.resolveText
          ? options.resolveText(props)
          : props.component.label || props.component.props.text || '按钮'

        return h(options.component, componentProps, () => text)
      }
    },
  })
}
