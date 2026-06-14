<script setup lang="ts">
import type { StyleValue } from 'vue'
import type { UiComponentProps } from '../../types'
import { computed } from 'vue'

defineOptions({
  name: 'OpenPageNaiveText',
  inheritAttrs: false,
})

const props = defineProps<UiComponentProps>()

const rootStyle = computed(resolveRootStyle)
const textContent = computed(resolveTextContent)

/**
 * 解析文本根节点样式。
 *
 * @returns 返回 schema props.style 配置的样式。
 */
function resolveRootStyle(): StyleValue | undefined {
  return props.component.props.style as StyleValue | undefined
}

/**
 * 解析文本展示内容。
 *
 * @returns 返回组件 label 作为纯展示文本。
 */
function resolveTextContent(): string {
  return props.component.label || ''
}
</script>

<template>
  <span
    class="openpage-text"
    :class="props.component.interactionClassName"
    :style="rootStyle"
  >
    {{ textContent }}
  </span>
</template>
