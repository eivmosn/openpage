<script setup lang="ts">
import type { UiComponentProps } from '../../types'
import { NInput } from 'naive-ui'
import { useFormField } from '../composables/useFormField'

defineOptions({
  name: 'OpenPageNaivePassword',
  inheritAttrs: false,
})

const props = defineProps<UiComponentProps>()
const field = useFormField(props, { inputType: 'password' })

/**
 * 更新密码项模型值。
 *
 * @param nextValue 输入组件上报的新值。
 */
async function handleUpdateValue(nextValue: string): Promise<void> {
  props.updateModelValue(nextValue)
  await props.emitComponentEvent('oninput', nextValue)
}
</script>

<template>
  <NInput
    :disabled="field.disabled.value"
    :placeholder="field.placeholder.value"
    :type="field.type.value"
    :value="field.value.value"
    :input-props="{
      autocomplete: 'username',
    }"
    @update:value="handleUpdateValue"
  />
</template>
