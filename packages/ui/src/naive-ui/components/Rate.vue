<script setup lang="ts">
import type { UiComponentProps } from '../../types'
import { NRate } from 'naive-ui'
import { computed } from 'vue'
import { useFormField } from '../composables/useFormField'

defineOptions({ name: 'OpenPageNaiveRate' })
const props = defineProps<UiComponentProps>()
const field = useFormField(props)
const value = computed(resolveValue)

/**
 * 解析评分当前值。
 *
 * @returns 返回评分值或未定义。
 */
function resolveValue(): number | undefined {
  return typeof field.rawValue.value === 'number' ? field.rawValue.value : undefined
}

/**
 * 更新评分模型值。
 *
 * @param nextValue 评分组件上报的新值。
 */
async function handleUpdateValue(nextValue: number): Promise<void> {
  props.updateModelValue(nextValue)
  await props.emitComponentEvent('onchange', nextValue)
}
</script>

<template>
  <NRate
    v-bind="props.component.props"
    :disabled="field.disabled.value"
    :value="value"
    @update:value="handleUpdateValue"
  />
</template>
