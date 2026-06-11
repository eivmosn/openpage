<script setup lang="ts">
import type { UiComponentProps } from '../../types'
import { NColorPicker } from 'naive-ui'
import { computed } from 'vue'
import { useFormField } from '../composables/useFormField'
import { toBusinessStringValue, toNaiveNullableString } from '../utils/emptyValue'

defineOptions({ name: 'OpenPageNaiveColorPicker' })
const props = defineProps<UiComponentProps>()
const field = useFormField(props)
const value = computed(() => toNaiveNullableString(field.rawValue.value))

/**
 * 更新颜色模型值。
 *
 * @param nextValue 颜色选择器上报的新值。
 */
async function handleUpdateValue(nextValue: string | null): Promise<void> {
  const modelValue = toBusinessStringValue(nextValue)
  props.updateModelValue(modelValue)
  await props.emitComponentEvent('onchange', modelValue)
}
</script>

<template>
  <NColorPicker
    v-bind="props.component.props"
    :disabled="field.disabled.value"
    :value="value"
    @update:value="handleUpdateValue"
  />
</template>
