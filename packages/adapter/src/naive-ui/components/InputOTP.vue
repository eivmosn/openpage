<script setup lang="ts">
import type { UiComponentProps } from '../../types'
import { NInputOtp } from 'naive-ui'
import { useFormField } from '../composables/useFormField'

defineOptions({ name: 'OpenPageNaiveInputOtp' })
const props = defineProps<UiComponentProps>()
const field = useFormField(props)

/**
 * 更新验证码输入值。
 *
 * @param nextValue 验证码组件上报的字符数组。
 */
async function handleUpdateValue(nextValue: string[]): Promise<void> {
  props.updateModelValue(nextValue)
  await props.emitComponentEvent('oninput', nextValue)
}
</script>

<template>
  <NInputOtp
    v-bind="props.component.props"
    :disabled="field.disabled.value"
    :value="Array.isArray(field.rawValue.value) ? field.rawValue.value : []"
    @update:value="handleUpdateValue"
  />
</template>
