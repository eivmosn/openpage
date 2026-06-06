import type { UiNodeProps } from '../types'
import type { CreateContainerComponentOptions } from './types'
import { defineComponent, h } from 'vue'
import { uiNodeProps } from './props'

/**
 * 创建透传节点属性和子节点的通用容器组件。
 *
 * @param options UI 容器组件及属性解析配置。
 * @returns 返回可注册到适配器组件映射中的 Vue 组件。
 */
export function createContainerComponent(options: CreateContainerComponentOptions) {
  return defineComponent({
    name: options.name || 'OpenPageAdapterContainer',
    props: uiNodeProps,
    setup(rawProps, { slots }) {
      const props = rawProps as UiNodeProps

      return () => {
        const children = slots.default?.() || []
        const content = options.renderLabel === false || !props.node.label
          ? children
          : [props.node.label, ...children]

        return h(options.component, {
          ...props.node.props,
          ...options.resolveProps?.(props),
        }, () => content)
      }
    },
  })
}
