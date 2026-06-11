<script setup lang="ts">
import type { UiComponentProps } from '../../types'
import { NCheckbox, NCheckboxGroup, NSpace } from 'naive-ui'
import { computed } from 'vue'
import { useComponentOptions } from '../composables/useComponentOptions'
import { useFormField } from '../composables/useFormField'

defineOptions({
  name: 'OpenPageNaiveCheckboxGroup',
  inheritAttrs: false,
})

const props = defineProps<UiComponentProps>()
const field = useFormField(props)
const options = useComponentOptions(props)
const selectedValues = computed(resolveValue)

type CheckboxValue = string | number

/**
 * 解析多选组当前值。
 *
 * @returns 返回多选组选中值数组。
 */
function resolveValue(): CheckboxValue[] {
  if (!Array.isArray(field.rawValue.value)) {
    return []
  }

  return field.rawValue.value.filter(isCheckboxValue)
}

/**
 * 判断值是否为多选组可接受值。
 *
 * @param value 需要判断的原始值。
 * @returns 返回是否为多选组可接受值。
 */
function isCheckboxValue(value: unknown): value is CheckboxValue {
  return typeof value === 'string' || typeof value === 'number'
}

/**
 * 更新多选组模型值。
 *
 * @param nextValue 多选组上报的新值。
 */
async function handleUpdateValue(nextValue: CheckboxValue[]): Promise<void> {
  props.updateModelValue(nextValue)
  await props.emitComponentEvent('onchange', nextValue)
}
</script>

<template>
  <NCheckboxGroup
    :disabled="field.disabled.value"
    :value="selectedValues"
    @update:value="handleUpdateValue"
  >
    <NSpace>
      <NCheckbox
        v-for="option in options"
        :key="String(option.value)"
        :label="String(option.label)"
        :value="option.value"
      />
    </NSpace>
  </NCheckboxGroup>
</template>
