import type { UiComponentProps } from '../types'
import type { CreateContainerComponentOptions } from './types'
import { defineComponent, h } from 'vue'
import { uiComponentProps } from './props'

/**
 * 创建透传组件属性和子组件的通用容器组件。
 *
 * @param options UI 容器组件及属性解析配置。
 * @returns 返回可注册到适配器组件映射中的 Vue 组件。
 */
export function createContainerComponent(options: CreateContainerComponentOptions) {
  return defineComponent({
    name: options.name || 'OpenPageAdapterContainer',
    props: uiComponentProps,
    setup(rawProps, { slots }) {
      const props = rawProps as UiComponentProps

      return () => {
        const children = slots.default?.() || []
        const content = options.renderLabel === false || !props.component.label
          ? children
          : [props.component.label, ...children]

        return h(options.component, {
          ...props.component.props,
          ...options.resolveProps?.(props),
        }, () => content)
      }
    },
  })
}
