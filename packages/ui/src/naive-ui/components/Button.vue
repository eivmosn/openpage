<script setup lang="ts">
import type { UiComponentProps } from '../../types'
import { NButton, NPopconfirm, NTooltip } from 'naive-ui'
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
const popconfirmOptions = computed(resolvePopconfirmOptions)
const tooltipOptions = computed(resolveTooltipOptions)
const popconfirmText = computed(() => String(popconfirmOptions.value?.text || '确认执行该操作？'))
const popconfirmPositiveText = computed(() => String(popconfirmOptions.value?.positiveText || '确认'))
const popconfirmNegativeText = computed(() => String(popconfirmOptions.value?.negativeText || '取消'))
const popconfirmShowIcon = computed(() => popconfirmOptions.value?.showIcon !== false)
const popconfirmCustomIcon = computed(() => resolveString(popconfirmOptions.value?.customIcon))
const popconfirmTrigger = computed(() => resolveOverlayTrigger(popconfirmOptions.value?.trigger, 'click'))
const popconfirmMaxWidth = computed(() => resolveOverlayMaxWidth(popconfirmOptions.value?.maxWidth))
const tooltipText = computed(() => String(tooltipOptions.value?.text || ''))
const tooltipTrigger = computed(() => resolveOverlayTrigger(tooltipOptions.value?.trigger, 'hover'))
const tooltipMaxWidth = computed(() => resolveOverlayMaxWidth(tooltipOptions.value?.maxWidth))

type OverlayTrigger = 'click' | 'hover' | 'focus' | 'manual'

interface ButtonPopconfirmOptions {
  positiveText?: unknown
  negativeText?: unknown
  text?: unknown
  showIcon?: unknown
  customIcon?: unknown
  trigger?: unknown
  maxWidth?: unknown
}

interface ButtonTooltipOptions {
  text?: unknown
  trigger?: unknown
  maxWidth?: unknown
}

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
 * 解析按钮确认弹窗配置。
 *
 * @returns 返回确认弹窗配置；未配置时返回空值。
 */
function resolvePopconfirmOptions(): ButtonPopconfirmOptions | undefined {
  const rawOptions = props.component.props.popconfirm

  if (!isRecord(rawOptions)) {
    return undefined
  }

  return rawOptions
}

/**
 * 解析按钮提示配置。
 *
 * @returns 返回提示配置；确认弹窗已配置或提示内容为空时返回空值。
 */
function resolveTooltipOptions(): ButtonTooltipOptions | undefined {
  if (popconfirmOptions.value) {
    return undefined
  }

  const rawOptions = props.component.props.tooltip

  if (!isRecord(rawOptions) || !resolveString(rawOptions.text)) {
    return undefined
  }

  return rawOptions
}

/**
 * 解析浮层触发方式。
 *
 * @param value 原始触发方式。
 * @param fallback 默认触发方式。
 * @returns 返回 Naive UI 支持的触发方式。
 */
function resolveOverlayTrigger(value: unknown, fallback: OverlayTrigger): OverlayTrigger {
  if (
    value === 'click'
    || value === 'hover'
    || value === 'focus'
    || value === 'manual'
  ) {
    return value
  }

  return fallback
}

/**
 * 解析浮层最大宽度。
 *
 * @param value 原始最大宽度。
 * @returns 返回有效宽度；未配置时返回空值。
 */
function resolveOverlayMaxWidth(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : undefined
}

/**
 * 解析字符串配置。
 *
 * @param value 原始配置值。
 * @returns 返回去除首尾空格后的字符串。
 */
function resolveString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * 判断值是否为普通对象配置。
 *
 * @param value 原始值。
 * @returns 返回是否为对象记录。
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * 触发按钮点击事件配置。
 */
async function handleClick(): Promise<void> {
  await props.emitComponentEvent('onclick')
}

/**
 * 确认弹窗确认后触发按钮点击事件配置。
 */
async function handlePositiveClick(): Promise<void> {
  await handleClick()
}
</script>

<template>
  <NPopconfirm
    v-if="popconfirmOptions"
    :max-width="popconfirmMaxWidth"
    :negative-text="popconfirmNegativeText"
    :positive-text="popconfirmPositiveText"
    :show-icon="popconfirmShowIcon"
    :trigger="popconfirmTrigger"
    @positive-click="handlePositiveClick"
  >
    <template #trigger>
      <NButton
        :disabled="isDisabled"
        :size="buttonSize"
        :type="buttonType"
      >
        {{ buttonText }}
      </NButton>
    </template>

    <template v-if="popconfirmCustomIcon" #icon>
      <span class="openpage-button__popconfirm-icon">
        {{ popconfirmCustomIcon }}
      </span>
    </template>

    {{ popconfirmText }}
  </NPopconfirm>

  <NTooltip
    v-else-if="tooltipOptions"
    :max-width="tooltipMaxWidth"
    :trigger="tooltipTrigger"
  >
    <template #trigger>
      <NButton
        :disabled="isDisabled"
        :size="buttonSize"
        :type="buttonType"
        @click="handleClick"
      >
        {{ buttonText }}
      </NButton>
    </template>

    {{ tooltipText }}
  </NTooltip>

  <NButton
    v-else
    :disabled="isDisabled"
    :size="buttonSize"
    :type="buttonType"
    @click="handleClick"
  >
    {{ buttonText }}
  </NButton>
</template>

<style scoped>
.openpage-button__popconfirm-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
</style>
