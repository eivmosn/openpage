<script setup lang="ts">
import type { UiComponentProps } from '../../types'
import { NAutoComplete } from 'naive-ui'
import { useFormField } from '../composables/useFormField'

defineOptions({
  name: 'OpenPageNaiveAutoComplete',
  inheritAttrs: false,
})
const props = defineProps<UiComponentProps>()
const field = useFormField(props)

/**
 * 更新自动完成输入值。
 *
 * @param nextValue 自动完成组件上报的新值。
 */
async function handleUpdateValue(nextValue: string): Promise<void> {
  props.updateModelValue(nextValue)
  await props.emitComponentEvent('oninput', nextValue)
}
</script>

<template>
  <NAutoComplete
    v-bind="props.component.props"
    :disabled="field.disabled.value"
    :value="field.value.value"
    @update:value="handleUpdateValue"
  />
</template>
