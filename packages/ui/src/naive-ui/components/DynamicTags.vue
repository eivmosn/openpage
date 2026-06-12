<script setup lang="ts">
import type { UiComponentProps } from '../../types'
import { NDynamicTags } from 'naive-ui'
import { computed } from 'vue'
import { useFormField } from '../composables/useFormField'

defineOptions({
  name: 'OpenPageNaiveDynamicTags',
  inheritAttrs: false,
})
const props = defineProps<UiComponentProps>()
const field = useFormField(props)
const value = computed(resolveValue)

type DynamicTagsValueType = 'string' | 'array'

interface DynamicTagOption {
  label: string
  value: string
}

/**
 * 解析动态标签当前值。
 *
 * @returns 返回字符串标签数组。
 */
function resolveValue(): string[] {
  if (!Array.isArray(field.rawValue.value)) {
    return []
  }

  return field.rawValue.value
    .map(resolveTagLabel)
    .filter((item): item is string => item.length > 0)
}

/**
 * 更新动态标签模型值。
 *
 * @param nextValue 动态标签组件上报的新值。
 */
async function handleUpdateValue(nextValue: string[]): Promise<void> {
  const modelValue = resolveModelValue(nextValue)

  props.updateModelValue(modelValue)
  await props.emitComponentEvent('onchange', modelValue)
}

/**
 * 解析标签展示文本。
 *
 * @param item 原始标签项。
 * @returns 返回可展示的标签文本。
 */
function resolveTagLabel(item: unknown): string {
  if (typeof item === 'string') {
    return item
  }

  if (isRecord(item)) {
    return String(item.label ?? item.value ?? '')
  }

  return ''
}

/**
 * 根据 valueType 解析写回状态的值。
 *
 * @param value 动态标签组件上报的字符串数组。
 * @returns 返回写回状态的字符串数组或对象数组。
 */
function resolveModelValue(value: string[]): string[] | DynamicTagOption[] {
  if (resolveValueType() === 'array') {
    return value.map(item => ({
      label: item,
      value: item,
    }))
  }

  return value
}

/**
 * 解析动态标签值类型。
 *
 * @returns 返回状态存储格式，默认使用字符串数组。
 */
function resolveValueType(): DynamicTagsValueType {
  return String(props.component.props.valueType || '').toLowerCase() === 'array'
    ? 'array'
    : 'string'
}

/**
 * 判断值是否为对象记录。
 *
 * @param value 原始值。
 * @returns 返回是否为对象记录。
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
</script>

<template>
  <NDynamicTags
    v-bind="props.component.props"
    :disabled="field.disabled.value"
    :value="value"
    @update:value="handleUpdateValue"
  />
</template>
