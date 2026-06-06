<script setup lang="ts">
import type { UiNodeProps } from '../../types'
import { NMention } from 'naive-ui'
import { useFormField } from '../composables/useFormField'

defineOptions({ name: 'OpenPageNaiveMention' })
const props = defineProps<UiNodeProps>()
const field = useFormField(props)

/**
 * 更新提及输入值。
 *
 * @param nextValue 提及组件上报的新值。
 */
async function handleUpdateValue(nextValue: string): Promise<void> {
  props.updateModelValue(nextValue)
  await props.emitNodeEvent('oninput', nextValue)
}
</script>

<template>
  <NMention
    v-bind="props.node.props"
    :disabled="field.disabled.value"
    :value="field.value.value"
    @update:value="handleUpdateValue"
  />
</template>
