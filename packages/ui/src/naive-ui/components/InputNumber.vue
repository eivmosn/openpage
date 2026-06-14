<script setup lang="ts">
import type { UiComponentProps } from '../../types'
import { NInputNumber } from 'naive-ui'
import { computed } from 'vue'
import { useFormField } from '../composables/useFormField'

defineOptions({
  name: 'OpenPageNaiveInputNumber',
  inheritAttrs: false,
})
const props = defineProps<UiComponentProps>()
const field = useFormField(props)
const readonly = computed(() => props.component.computedValue !== undefined || props.component.props.readonly === true)
const value = computed(resolveValue)

/**
 * 解析数字输入当前值。
 *
 * @returns 返回数字值或空值。
 */
function resolveValue(): number | null {
  return typeof field.rawValue.value === 'number' ? field.rawValue.value : null
}

/**
 * 更新数字输入模型值。
 *
 * @param nextValue 数字输入组件上报的新值。
 */
async function handleUpdateValue(nextValue: number | null): Promise<void> {
  props.updateModelValue(nextValue)
  await props.emitComponentEvent('onchange', nextValue)
}
</script>

<template>
  <NInputNumber
    v-bind="props.component.props"
    :disabled="field.disabled.value"
    :readonly="readonly"
    :value="value"
    :style="{ width: '100%' }"
    @update:value="handleUpdateValue"
  />
</template>
