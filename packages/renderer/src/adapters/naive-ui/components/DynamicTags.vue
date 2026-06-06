<script setup lang="ts">
import type { UiNodeProps } from '../../types'
import { NDynamicTags } from 'naive-ui'
import { computed } from 'vue'
import { useFormField } from '../composables/useFormField'

defineOptions({ name: 'OpenPageNaiveDynamicTags' })
const props = defineProps<UiNodeProps>()
const field = useFormField(props)
const value = computed(resolveValue)

/**
 * 解析动态标签当前值。
 *
 * @returns 返回字符串标签数组。
 */
function resolveValue(): string[] {
  return Array.isArray(field.rawValue.value)
    ? field.rawValue.value.filter((item): item is string => typeof item === 'string')
    : []
}

/**
 * 更新动态标签模型值。
 *
 * @param nextValue 动态标签组件上报的新值。
 */
async function handleUpdateValue(nextValue: string[]): Promise<void> {
  props.updateModelValue(nextValue)
  await props.emitNodeEvent('onchange', nextValue)
}
</script>

<template>
  <NDynamicTags
    v-bind="props.node.props"
    :disabled="field.disabled.value"
    :value="value"
    @update:value="handleUpdateValue"
  />
</template>
