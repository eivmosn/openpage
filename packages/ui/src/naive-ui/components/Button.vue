<script setup lang="ts">
import type { UiComponentProps } from '../../types'
import { NButton } from 'naive-ui'
import { computed } from 'vue'
import { resolveButtonSize, resolveButtonType } from '../utils/resolve'

defineOptions({
  name: 'OpenPageNaiveButton',
  inheritAttrs: false,
})

const props = defineProps<UiComponentProps>()

const buttonText = computed(resolveButtonText)
const buttonType = computed(resolveButtonVisualType)
const buttonSize = computed(resolveButtonVisualSize)
const isDisabled = computed(resolveButtonDisabled)

/**
 * 解析按钮显示文本。
 *
 * @returns 返回按钮显示文本。
 */
function resolveButtonText(): string {
  return String(props.component.label || props.component.props.text || '按钮')
}

/**
 * 解析按钮视觉类型。
 *
 * @returns 返回按钮视觉类型。
 */
function resolveButtonVisualType() {
  return resolveButtonType(props.component.props.type || props.component.props.variant)
}

/**
 * 解析按钮视觉尺寸。
 *
 * @returns 返回按钮视觉尺寸。
 */
function resolveButtonVisualSize() {
  return resolveButtonSize(props.component.props.size)
}

/**
 * 解析按钮是否禁用。
 *
 * @returns 返回按钮是否禁用。
 */
function resolveButtonDisabled(): boolean {
  return props.component.disabled === true || props.component.props.disabled === true
}

/**
 * 触发按钮点击事件配置。
 */
async function handleClick(): Promise<void> {
  await props.emitComponentEvent('onclick')
}
</script>

<template>
  <NButton
    :disabled="isDisabled"
    :size="buttonSize"
    :type="buttonType"
    @click="handleClick"
  >
    {{ buttonText }}
  </NButton>
</template>
