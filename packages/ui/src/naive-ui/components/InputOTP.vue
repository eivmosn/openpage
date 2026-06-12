<script setup lang="ts">
import type { UiComponentProps } from '../../types'
import { NInputOtp } from 'naive-ui'
import { computed } from 'vue'
import { useFormField } from '../composables/useFormField'

defineOptions({
  name: 'OpenPageNaiveInputOtp',
  inheritAttrs: false,
})
const props = defineProps<UiComponentProps>()
const field = useFormField(props)
const inputOtpProps = computed(resolveInputOtpProps)
const inputOtpValue = computed(resolveInputOtpValue)

type InputOtpValueType = 'string' | 'array'

/**
 * 更新验证码输入值。
 *
 * @param nextValue 验证码组件上报的字符数组。
 */
async function handleUpdateValue(nextValue: string[]): Promise<void> {
  const modelValue = resolveModelValue(nextValue)

  props.updateModelValue(modelValue)
  await props.emitComponentEvent('oninput', modelValue)
}

/**
 * 解析透传给 Naive UI 验证码组件的 props。
 *
 * @returns 返回已移除 OpenPage 自定义配置后的 props。
 */
function resolveInputOtpProps(): Record<string, unknown> {
  const { valueType: _valueType, ...inputProps } = props.component.props

  return inputProps
}

/**
 * 解析验证码组件展示值。
 *
 * @returns 返回 Naive UI 需要的字符数组。
 */
function resolveInputOtpValue(): string[] {
  const rawValue = field.rawValue.value

  if (Array.isArray(rawValue)) {
    return rawValue.map(value => String(value))
  }

  if (typeof rawValue === 'string') {
    return rawValue.split('')
  }

  return []
}

/**
 * 根据 valueType 解析写回状态的值。
 *
 * @param value 验证码字符数组。
 * @returns 返回写回状态的字符串或字符数组。
 */
function resolveModelValue(value: string[]): string | string[] {
  return resolveValueType() === 'array' ? value : value.join('')
}

/**
 * 解析验证码值类型。
 *
 * @returns 返回状态存储格式，默认使用字符串。
 */
function resolveValueType(): InputOtpValueType {
  return String(props.component.props.valueType || '').toLowerCase() === 'array'
    ? 'array'
    : 'string'
}
</script>

<template>
  <NInputOtp
    v-bind="inputOtpProps"
    :disabled="field.disabled.value"
    :value="inputOtpValue"
    @update:value="handleUpdateValue"
  />
</template>
