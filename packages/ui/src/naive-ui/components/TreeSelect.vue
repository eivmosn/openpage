<script setup lang="ts">
import type { UiComponentProps } from '../../types'
import { NTreeSelect } from 'naive-ui'
import { computed } from 'vue'
import { useFormField } from '../composables/useFormField'

defineOptions({
  name: 'OpenPageNaiveTreeSelect',
  inheritAttrs: false,
})
const props = defineProps<UiComponentProps>()
const field = useFormField(props)
const value = computed(resolveValue)

type TreeSelectValue = string | number | Array<string | number> | null

/**
 * 解析树选择器当前值。
 *
 * @returns 返回树选择器支持的值。
 */
function resolveValue(): TreeSelectValue {
  const rawValue = field.rawValue.value

  if (typeof rawValue === 'string' || typeof rawValue === 'number' || Array.isArray(rawValue)) {
    return rawValue as TreeSelectValue
  }

  return null
}

/**
 * 更新树选择器模型值。
 *
 * @param nextValue 树选择器上报的新值。
 */
async function handleUpdateValue(nextValue: TreeSelectValue): Promise<void> {
  props.updateModelValue(nextValue)
  await props.emitComponentEvent('onchange', nextValue)
}
</script>

<template>
  <NTreeSelect
    v-bind="props.component.props"
    :disabled="field.disabled.value"
    :value="value"
    @update:value="handleUpdateValue"
  />
</template>
