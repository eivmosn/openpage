<script setup lang="ts">
import type { UiComponentProps } from '../../types'
import { NRadio, NRadioGroup, NSpace } from 'naive-ui'
import { computed } from 'vue'
import { useComponentOptions } from '../composables/useComponentOptions'
import { useFormField } from '../composables/useFormField'
import { toNaiveNullableSelectValue } from '../utils/emptyValue'

defineOptions({
  name: 'OpenPageNaiveRadioGroup',
  inheritAttrs: false,
})

const props = defineProps<UiComponentProps>()
const field = useFormField(props)
const options = useComponentOptions(props)
const selectedValue = computed(resolveSelectedValue)

type RadioValue = string | number | null

/**
 * 解析单选组当前值。
 *
 * @returns 返回单选组当前值。
 */
function resolveSelectedValue(): RadioValue {
  return toNaiveNullableSelectValue(field.rawValue.value)
}

/**
 * 更新单选组模型值。
 *
 * @param nextValue 单选组上报的新值。
 */
async function handleUpdateValue(nextValue: string | number): Promise<void> {
  props.updateModelValue(nextValue)
  await props.emitComponentEvent('onchange', nextValue)
}
</script>

<template>
  <NRadioGroup
    :disabled="field.disabled.value"
    :value="selectedValue"
    @update:value="handleUpdateValue"
  >
    <NSpace>
      <NRadio
        v-for="option in options"
        :key="String(option.value)"
        :label="String(option.label)"
        :value="option.value"
      />
    </NSpace>
  </NRadioGroup>
</template>
