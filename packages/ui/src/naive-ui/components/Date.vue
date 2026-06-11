<script setup lang="ts">
import type { UiComponentProps } from '../../types'
import { NDatePicker } from 'naive-ui'
import { computed } from 'vue'
import { useFormField } from '../composables/useFormField'
import { toBusinessStringValue, toNaiveNullableString } from '../utils/emptyValue'

defineOptions({
  name: 'OpenPageNaiveDate',
  inheritAttrs: false,
})

const props = defineProps<UiComponentProps>()
const field = useFormField(props)
const formattedValue = computed(resolveFormattedValue)
const valueFormat = computed(resolveValueFormat)

/**
 * 解析日期当前字符串值。
 *
 * @returns 返回日期当前字符串值。
 */
function resolveFormattedValue(): string | null {
  return toNaiveNullableString(field.rawValue.value)
}

/**
 * 解析日期格式化值格式。
 *
 * @returns 返回日期字符串格式。
 */
function resolveValueFormat(): string {
  return String(props.component.props.valueFormat || 'yyyy-MM-dd')
}

/**
 * 更新日期模型值。
 *
 * @param nextValue 日期组件上报的新字符串值。
 */
async function handleUpdateValue(nextValue: string | null): Promise<void> {
  const modelValue = toBusinessStringValue(nextValue)
  props.updateModelValue(modelValue)
  await props.emitComponentEvent('onchange', modelValue)
}
</script>

<template>
  <NDatePicker
    clearable
    type="date"
    :disabled="field.disabled.value"
    :formatted-value="formattedValue"
    :placeholder="field.placeholder.value"
    :value-format="valueFormat"
    @update:formatted-value="handleUpdateValue"
  />
</template>
