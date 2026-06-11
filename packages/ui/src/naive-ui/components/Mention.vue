<script setup lang="ts">
import type { UiComponentProps } from '../../types'
import { NMention } from 'naive-ui'
import { useFormField } from '../composables/useFormField'

defineOptions({
  name: 'OpenPageNaiveMention',
  inheritAttrs: false,
})
const props = defineProps<UiComponentProps>()
const field = useFormField(props)

/**
 * 更新提及输入值。
 *
 * @param nextValue 提及组件上报的新值。
 */
async function handleUpdateValue(nextValue: string): Promise<void> {
  props.updateModelValue(nextValue)
  await props.emitComponentEvent('oninput', nextValue)
}
</script>

<template>
  <NMention
    v-bind="props.component.props"
    :disabled="field.disabled.value"
    :value="field.value.value"
    @update:value="handleUpdateValue"
  />
</template>
