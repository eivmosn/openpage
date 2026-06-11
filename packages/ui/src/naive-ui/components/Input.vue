<script setup lang="ts">
import type { UiComponentProps } from '../../types'
import { NInput } from 'naive-ui'
import { useFormField } from '../composables/useFormField'

defineOptions({
  name: 'OpenPageNaiveInput',
  inheritAttrs: false,
})

const props = defineProps<UiComponentProps>()
const field = useFormField(props)

/**
 * 更新输入框模型值。
 *
 * @param nextValue 输入框上报的新值。
 */
async function handleUpdateValue(nextValue: string): Promise<void> {
  props.updateModelValue(nextValue)
  await props.emitComponentEvent('oninput', nextValue)
}
</script>

<template>
  <NInput
    :disabled="field.disabled.value"
    :input-props="{
      autocomplete: 'current-password',
    }"
    :placeholder="field.placeholder.value"
    :type="field.type.value"
    :value="field.value.value"
    @update:value="handleUpdateValue"
  />
</template>
