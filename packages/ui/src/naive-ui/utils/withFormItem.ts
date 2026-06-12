import type { Component } from 'vue'
import type { NaiveFormFieldBinding } from '../composables/useFormField'
import { NFormItem, NTooltip } from 'naive-ui'
import { defineComponent, h } from 'vue'
import { useFormField } from '../composables/useFormField'
import { resolveComponentName } from './resolveComponentName'
import { uiComponentProps } from './uiComponentProps'

/**
 * 标签下划线
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

      return () => h(NFormItem, {
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
