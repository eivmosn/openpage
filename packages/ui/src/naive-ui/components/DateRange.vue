<script setup lang="ts">
import type { UiComponentProps } from '../../types'
import { NDatePicker } from 'naive-ui'
import { computed } from 'vue'
import { useFormField } from '../composables/useFormField'
import { toBusinessStringValue, toNaiveNullableString } from '../utils/emptyValue'

defineOptions({
  name: 'OpenPageNaiveDateRange',
  inheritAttrs: false,
})

const props = defineProps<UiComponentProps>()
const field = useFormField(props)
const formattedValue = computed(resolveFormattedValue)
const valueFormat = computed(resolveValueFormat)

/**
 * 解析日期范围当前字符串值。
 *
 * @returns 返回日期范围当前字符串值。
 */
function resolveFormattedValue(): [string, string] | null {
  const rawValue = field.rawValue.value

  if (!Array.isArray(rawValue)) {
    return null
  }

  const start = toNaiveNullableString(rawValue[0])
  const end = toNaiveNullableString(rawValue[1])

  return start && end ? [start, end] : null
}

/**
 * 解析日期范围格式化值格式。
 *
 * @returns 返回日期范围字符串格式。
 */
function resolveValueFormat(): string {
  return String(props.component.props.valueFormat || 'yyyy-MM-dd')
}

/**
 * 更新日期范围模型值。
 *
 * @param nextValue 日期范围组件上报的新字符串值。
 */
async function handleUpdateValue(nextValue: [string, string] | null): Promise<void> {
  const modelValue = Array.isArray(nextValue)
    ? [toBusinessStringValue(nextValue[0]), toBusinessStringValue(nextValue[1])]
    : ['', '']

  props.updateModelValue(modelValue)
  await props.emitComponentEvent('onchange', modelValue)
}
</script>

<template>
  <NDatePicker
    clearable
    type="daterange"
    :disabled="field.disabled.value"
    :formatted-value="formattedValue"
    :placeholder="field.placeholder.value"
    :value-format="valueFormat"
    @update:formatted-value="handleUpdateValue"
  />
</template>
