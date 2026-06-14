import type { FormItemInst } from 'naive-ui'
import type { Component } from 'vue'
import type { NaiveFormFieldBinding } from '../composables/useFormField'
import { NFormItem, NTooltip } from 'naive-ui'
import { defineComponent, h, inject, shallowRef, watchEffect } from 'vue'
import { useFormField } from '../composables/useFormField'
import { naiveFormItemRegistryKey } from './formItemRegistry'
import { resolveComponentName } from './resolveComponentName'
import { uiComponentProps } from './uiComponentProps'

/**
 * 渲染表单项标签。
 *
 * @param field 当前表单字段绑定。
 * @returns 返回标签渲染内容。
 */
function formItemLabel(field: NaiveFormFieldBinding) {
  const renderLabel = () => h('div', {
    style: {
      textDecoration: field.description.value ? '#1a1a1a wavy underline' : 'none',
      textUnderlineOffset: '4px',
    },
  }, field.label.value)

  if (field.description.value) {
    return h(NTooltip, {
      style: {
        whiteSpace: 'pre-line',
      },
    }, {
      trigger: renderLabel,
      default: () => field.description.value,
    })
  }

  return renderLabel()
}

/**
 * 为 Naive UI 字段组件挂载统一的 NFormItem 外壳。
 *
 * @param component 需要包装的真实字段组件。
 * @returns 返回带表单项能力的组件。
 */
export function withFormItem(component: Component): Component {
  return defineComponent({
    name: `OpenPageNaiveFormItem${resolveComponentName(component)}`,
    inheritAttrs: false,
    props: uiComponentProps,
    setup(props, { slots }) {
      const field = useFormField(props)
      const formItemRef = shallowRef<FormItemInst | null>(null)
      const formItemRegistry = inject(naiveFormItemRegistryKey, undefined)

      watchEffect((onCleanup) => {
        const formItem = formItemRef.value
        const path = field.path.value

        if (!formItem || !path || !formItemRegistry) {
          return
        }

        const unregister = formItemRegistry.register(path, formItem)
        onCleanup(unregister)
      })

      return () => h(NFormItem, {
        ref: formItemRef,
        path: field.path.value,
        required: field.required.value,
        rule: field.rule.value,
        showFeedback: field.showFeedback.value,
        labelWidth: field.labelWidth.value,
      }, {
        label: () => formItemLabel(field),
        default: () => h(component, props, slots),
      })
    },
  })
}
