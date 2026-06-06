<script setup lang="ts">
import type { UiNodeProps } from '../../types'
import { NRadio, NRadioGroup, NSpace } from 'naive-ui'
import { computed } from 'vue'
import { useFormField } from '../composables/useFormField'
import { useNodeOptions } from '../composables/useNodeOptions'
import { toNaiveNullableSelectValue } from '../utils/emptyValue'

defineOptions({
  name: 'OpenPageNaiveRadioGroup',
})

const props = defineProps<UiNodeProps>()
const field = useFormField(props)
const options = useNodeOptions(props)
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
  await props.emitNodeEvent('onchange', nextValue)
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
