<script setup lang="ts">
import type { UiNodeProps } from '../../types'
import { NInputNumber } from 'naive-ui'
import { computed } from 'vue'
import { useFormField } from '../composables/useFormField'

defineOptions({ name: 'OpenPageNaiveInputNumber' })
const props = defineProps<UiNodeProps>()
const field = useFormField(props)
const readonly = computed(() => props.node.computedValue !== undefined || props.node.props.readonly === true)
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
  await props.emitNodeEvent('onchange', nextValue)
}
</script>

<template>
  <NInputNumber
    v-bind="props.node.props"
    :disabled="field.disabled.value"
    :readonly="readonly"
    :value="value"
    @update:value="handleUpdateValue"
  />
</template>
