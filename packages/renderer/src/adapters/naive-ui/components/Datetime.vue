<script setup lang="ts">
import type { UiNodeProps } from '../../types'
import { NDatePicker } from 'naive-ui'
import { computed } from 'vue'
import { useFormField } from '../composables/useFormField'
import { toBusinessStringValue, toNaiveNullableString } from '../utils/emptyValue'

defineOptions({
  name: 'OpenPageNaiveDatetime',
})

const props = defineProps<UiNodeProps>()
const field = useFormField(props)
const formattedValue = computed(resolveFormattedValue)
const valueFormat = computed(resolveValueFormat)

/**
 * 解析日期时间当前字符串值。
 *
 * @returns 返回日期时间当前字符串值。
 */
function resolveFormattedValue(): string | null {
  return toNaiveNullableString(field.rawValue.value)
}

/**
 * 解析日期时间格式化值格式。
 *
 * @returns 返回日期时间字符串格式。
 */
function resolveValueFormat(): string {
  return String(props.node.props.valueFormat || 'yyyy-MM-dd HH:mm:ss')
}

/**
 * 更新日期时间模型值。
 *
 * @param nextValue 日期时间组件上报的新字符串值。
 */
async function handleUpdateValue(nextValue: string | null): Promise<void> {
  const modelValue = toBusinessStringValue(nextValue)
  props.updateModelValue(modelValue)
  await props.emitNodeEvent('onchange', modelValue)
}
</script>

<template>
  <NDatePicker
    clearable
    type="datetime"
    :disabled="field.disabled.value"
    :formatted-value="formattedValue"
    :placeholder="field.placeholder.value"
    :value-format="valueFormat"
    @update:formatted-value="handleUpdateValue"
  />
</template>
