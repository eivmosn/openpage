<script setup lang="ts">
import type { UiNodeProps } from '../../types'
import { NAutoComplete } from 'naive-ui'
import { useFormField } from '../composables/useFormField'

defineOptions({ name: 'OpenPageNaiveAutoComplete' })
const props = defineProps<UiNodeProps>()
const field = useFormField(props)

/**
 * 更新自动完成输入值。
 *
 * @param nextValue 自动完成组件上报的新值。
 */
async function handleUpdateValue(nextValue: string): Promise<void> {
  props.updateModelValue(nextValue)
  await props.emitNodeEvent('oninput', nextValue)
}
</script>

<template>
  <NAutoComplete
    v-bind="props.node.props"
    :disabled="field.disabled.value"
    :value="field.value.value"
    @update:value="handleUpdateValue"
  />
</template>
