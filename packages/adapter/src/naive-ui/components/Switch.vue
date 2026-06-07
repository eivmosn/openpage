<script setup lang="ts">
import type { UiComponentProps } from '../../types'
import { NSwitch } from 'naive-ui'
import { computed } from 'vue'
import { useFormField } from '../composables/useFormField'

defineOptions({
  name: 'OpenPageNaiveSwitch',
})

const props = defineProps<UiComponentProps>()
const field = useFormField(props)
const checkedValue = computed(resolveCheckedValue)
const switchValue = computed(resolveSwitchValue)
const uncheckedValue = computed(resolveUncheckedValue)

type SwitchValue = boolean | string | number

/**
 * 解析开关选中值。
 *
 * @returns 返回开关选中时写入的值。
 */
function resolveCheckedValue(): SwitchValue {
  return resolveSwitchOptionValue(props.component.props.checkedValue, true)
}

/**
 * 解析开关未选中值。
 *
 * @returns 返回开关未选中时写入的值。
 */
function resolveUncheckedValue(): SwitchValue {
  return resolveSwitchOptionValue(props.component.props.uncheckedValue, false)
}

/**
 * 解析开关当前值。
 *
 * @returns 返回开关当前值。
 */
function resolveSwitchValue(): SwitchValue {
  return resolveSwitchOptionValue(field.rawValue.value, false)
}

/**
 * 解析开关可接受的值。
 *
 * @param value 需要解析的原始值。
 * @param fallback 解析失败时使用的默认值。
 * @returns 返回开关可接受的值。
 */
function resolveSwitchOptionValue(value: unknown, fallback: SwitchValue): SwitchValue {
  return typeof value === 'boolean' || typeof value === 'string' || typeof value === 'number' ? value : fallback
}

/**
 * 更新开关模型值。
 *
 * @param nextValue 开关上报的新值。
 */
async function handleUpdateValue(nextValue: SwitchValue): Promise<void> {
  props.updateModelValue(nextValue)
  await props.emitComponentEvent('onchange', nextValue)
}
</script>

<template>
  <NSwitch
    :checked-value="checkedValue"
    :disabled="field.disabled.value"
    :unchecked-value="uncheckedValue"
    :value="switchValue"
    @update:value="handleUpdateValue"
  />
</template>
