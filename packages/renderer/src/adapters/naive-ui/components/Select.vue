<script setup lang="ts">
import type { UiNodeProps } from '../../types'
import { NSelect } from 'naive-ui'
import { computed } from 'vue'
import { useFormField } from '../composables/useFormField'
import { useNodeOptions } from '../composables/useNodeOptions'
import { toBusinessSelectValue, toNaiveNullableSelectValue } from '../utils/emptyValue'

defineOptions({
  name: 'OpenPageNaiveSelect',
})

const props = defineProps<UiNodeProps>()
const field = useFormField(props)
const options = useNodeOptions(props)
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
  props.updateModelValue(modelValue)
  await props.emitNodeEvent('onchange', modelValue)
}
</script>

<template>
  <NSelect
    :disabled="field.disabled.value"
    :options="options"
    :placeholder="field.placeholder.value"
    :value="selectedValue"
    @update:value="handleUpdateValue"
  />
</template>
