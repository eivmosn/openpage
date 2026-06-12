<script setup lang="ts">
import type { StyleValue } from 'vue'
import type { UiComponentProps } from '../../types'
import { NScrollbar } from 'naive-ui'
import { computed } from 'vue'
import { omitProps } from '../utils/omitProps'

defineOptions({
  name: 'OpenPageNaiveDiv',
  inheritAttrs: false,
})

const props = defineProps<UiComponentProps>()

const scrollbar = computed(resolveScrollbar)
const divProps = computed(resolveDivProps)
const rootStyle = computed(resolveRootStyle)

/**
 * 判断当前容器是否启用内部滚动条。
 *
 * @returns 返回是否启用 Naive UI 滚动条。
 */
function resolveScrollbar(): boolean {
  return props.component.props.scrollbar === true
}

/**
 * 解析需要透传到原生 div 的属性。
 *
 * @returns 返回剔除 OpenPage 容器内部配置后的属性对象。
 */
function resolveDivProps(): Record<string, unknown> {
  return omitProps(props.component.props, ['scrollbar', 'style'])
}

/**
 * 解析容器根节点样式。
 */
function resolveRootStyle(): StyleValue | undefined {
  const style = props.component.props.style as StyleValue | undefined
  return style
}
</script>

<template>
  <div
    v-bind="divProps"
    class="openpage-div"
    :class="[
      scrollbar && 'openpage-div--scrollbar',
      props.component.interactionClassName,
    ]"
    :style="rootStyle"
  >
    <NScrollbar
      v-if="scrollbar"
    >
      <slot />
    </NScrollbar>
    <slot v-else />
  </div>
</template>
