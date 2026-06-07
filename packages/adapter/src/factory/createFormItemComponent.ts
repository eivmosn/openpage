import type { UiComponentProps } from '../types'
import type { CreateFormItemComponentOptions } from './types'
import { defineComponent, h } from 'vue'
import { uiComponentProps } from './props'

/**
 * 创建映射标签、模型路径和必填状态的通用表单项组件。
 *
 * @param options UI 表单项组件及属性名称映射配置。
 * @returns 返回可设置为适配器 formItem 的 Vue 组件。
 */
export function createFormItemComponent(options: CreateFormItemComponentOptions) {
  const labelProp = options.labelProp === undefined ? 'label' : options.labelProp
  const pathProp = options.pathProp === undefined ? 'path' : options.pathProp
  const requiredProp = options.requiredProp === undefined ? 'required' : options.requiredProp

  return defineComponent({
    name: options.name || 'OpenPageAdapterFormItem',
    props: uiComponentProps,
    setup(rawProps, { slots }) {
      const props = rawProps as UiComponentProps

      /**
       * 解析当前表单项需要传给 UI 组件的属性。
       *
       * @returns 返回映射后的表单项属性。
       */
      function resolveComponentProps(): Record<string, unknown> {
        const componentProps: Record<string, unknown> = {
          ...options.resolveProps?.(props),
        }

        if (labelProp) {
          componentProps[labelProp] = props.component.label || props.component.props.label
        }

        if (pathProp) {
          componentProps[pathProp] = props.component.model?.path
        }

        if (requiredProp) {
          componentProps[requiredProp] = props.component.required === true || props.component.props.required === true
        }

        return componentProps
      }

      return () => h(options.component, resolveComponentProps(), slots)
    },
  })
}
