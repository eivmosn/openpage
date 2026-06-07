<script setup lang="ts">
import type { UiComponentProps } from '../../types'
import { NInput } from 'naive-ui'
import { useFormField } from '../composables/useFormField'

defineOptions({
  name: 'OpenPageNaiveTextarea',
})

const props = defineProps<UiComponentProps>()
const field = useFormField(props, { inputType: 'textarea' })

/**
 * 更新多行文本模型值。
 *
 * @param nextValue 多行文本上报的新值。
 */
async function handleUpdateValue(nextValue: string): Promise<void> {
  props.updateModelValue(nextValue)
  await props.emitComponentEvent('oninput', nextValue)
}
</script>

<template>
  <NInput
    :autosize="props.component.props.autosize !== false"
    :disabled="field.disabled.value"
    :placeholder="field.placeholder.value"
    :type="field.type.value"
    :value="field.value.value"
    @update:value="handleUpdateValue"
  />
</template>
