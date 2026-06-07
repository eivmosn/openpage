<script setup lang="ts">
import type { UiComponentProps } from '../../types'
import { NTimePicker } from 'naive-ui'
import { computed } from 'vue'
import { useFormField } from '../composables/useFormField'

defineOptions({ name: 'OpenPageNaiveTimePicker' })
const props = defineProps<UiComponentProps>()
const field = useFormField(props)
const value = computed(resolveValue)

/**
 * 解析时间选择器当前值。
 *
 * @returns 返回时间戳或空值。
 */
function resolveValue(): number | null {
  return typeof field.rawValue.value === 'number' ? field.rawValue.value : null
}

/**
 * 更新时间选择器模型值。
 *
 * @param nextValue 时间选择器上报的新时间戳。
 */
async function handleUpdateValue(nextValue: number | null): Promise<void> {
  props.updateModelValue(nextValue)
  await props.emitComponentEvent('onchange', nextValue)
}
</script>

<template>
  <NTimePicker
    v-bind="props.component.props"
    :disabled="field.disabled.value"
    :value="value"
    @update:value="handleUpdateValue"
  />
</template>
