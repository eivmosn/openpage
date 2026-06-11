<script setup lang="ts">
import type { UiComponentProps } from '../../types'
import { NSlider } from 'naive-ui'
import { computed } from 'vue'
import { useFormField } from '../composables/useFormField'

defineOptions({
  name: 'OpenPageNaiveSlider',
  inheritAttrs: false,
})
const props = defineProps<UiComponentProps>()
const field = useFormField(props)
const value = computed(resolveValue)

type SliderValue = number | number[]

/**
 * 解析滑块当前值。
 *
 * @returns 返回单值或范围值。
 */
function resolveValue(): SliderValue {
  const rawValue = field.rawValue.value
  return typeof rawValue === 'number' || Array.isArray(rawValue) ? rawValue as SliderValue : 0
}

/**
 * 更新滑块模型值。
 *
 * @param nextValue 滑块组件上报的新值。
 */
async function handleUpdateValue(nextValue: SliderValue): Promise<void> {
  props.updateModelValue(nextValue)
  await props.emitComponentEvent('onchange', nextValue)
}
</script>

<template>
  <NSlider
    v-bind="props.component.props"
    :disabled="field.disabled.value"
    :value="value"
    @update:value="handleUpdateValue"
  />
</template>
