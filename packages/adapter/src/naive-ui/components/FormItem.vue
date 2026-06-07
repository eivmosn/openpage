<script setup lang="ts">
import type { FormItemRule } from 'naive-ui'
import type { UiComponentProps } from '../../types'
import { NFormItem } from 'naive-ui'
import { computed } from 'vue'
import { useFormField } from '../composables/useFormField'

defineOptions({
  name: 'OpenPageNaiveFormItem',
})

const props = defineProps<UiComponentProps>()
const field = useFormField(props)
const rule = computed(resolveRule)

/**
 * 解析字段校验规则。
 *
 * @returns 返回适合当前字段类型的校验规则。
 */
function resolveRule(): FormItemRule | undefined {
  if (props.component.required !== true && props.component.props.required !== true) {
    return undefined
  }

  return {
    message: String(props.component.props.message || props.component.props.placeholder || '请填写必填项'),
    required: true,
    trigger: ['blur', 'input', 'change'],
    validator: validateRequired,
  }
}

/**
 * 校验字段是否已填写。
 *
 * @param _rule 当前校验规则。
 * @param value 当前字段值。
 * @returns 返回字段是否满足必填要求。
 */
function validateRequired(_rule: FormItemRule, value: unknown): boolean {
  if (props.component.type === 'switch') {
    return value === (props.component.props.checkedValue ?? true)
  }

  if (Array.isArray(value)) {
    return value.length > 0
  }

  return value !== undefined && value !== null && value !== ''
}
</script>

<template>
  <NFormItem
    :label="field.label.value"
    :path="field.path.value"
    :rule="rule"
    :show-feedback="field.showFeedback.value"
  >
    <slot />
  </NFormItem>
</template>
