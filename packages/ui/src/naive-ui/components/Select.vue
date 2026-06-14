<script setup lang="ts">
import type { SelectOption } from 'naive-ui'
import type { UiComponentProps } from '../../types'
import { NSelect } from 'naive-ui'
import { computed } from 'vue'
import { useComponentOptions } from '../composables/useComponentOptions'
import { useFormField } from '../composables/useFormField'
import { toBusinessSelectValue, toNaiveNullableSelectValue } from '../utils/emptyValue'

defineOptions({
  name: 'OpenPageNaiveSelect',
  inheritAttrs: false,
})

const props = defineProps<UiComponentProps>()
const field = useFormField(props)
const options = useComponentOptions(props)
const selectedValue = computed(resolveSelectedValue)

type SelectValue = string | number | null

/**
 * 解析选择器当前值。
 *
 * @returns 返回选择器当前值。
 */
function resolveSelectedValue(): SelectValue {
  return toNaiveNullableSelectValue(field.rawValue.value)
}

/**
 * 更新选择器模型值。
 *
 * @param nextValue 选择器上报的新值。
 */
async function handleUpdateValue(nextValue: string | number | null): Promise<void> {
  const modelValue = toBusinessSelectValue(nextValue)
  const selectedOption = resolveSelectedOption(modelValue)
  props.updateModelValue(modelValue)
  await props.emitComponentEvent('onchange', selectedOption)
}

/**
 * 根据选择值获取完整静态选项。
 *
 * @param value 当前选择器业务值。
 * @returns 返回匹配的完整选项，清空或未匹配时返回 undefined。
 */
function resolveSelectedOption(value: unknown): SelectOption | undefined {
  return options.value.find(option => option.value === value)
}
</script>

<template>
  <NSelect
    :disabled="field.disabled.value"
    :options="options"
    :placeholder="field.placeholder.value"
    :value="selectedValue"
    clearable
    @update:value="handleUpdateValue"
  />
</template>
