<script setup lang="ts">
import type { UiNodeProps } from '../../types'
import { computed, mergeProps, useAttrs } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<UiNodeProps>()
const attrs = useAttrs()

const divProps = computed(resolveDivProps)
const shouldShowDebugState = computed(resolveDebugStateVisible)

/**
 * 解析容器透传属性。
 *
 * @returns 返回过滤调试配置后的容器属性。
 */
function resolveDivProps(): Record<string, unknown> {
  const { debug, ...restProps } = props.node.props
  return mergeProps(attrs, restProps)
}

/**
 * 解析是否展示调试状态。
 *
 * @returns 返回是否展示当前运行时状态。
 */
function resolveDebugStateVisible(): boolean {
  return props.node.props.debug === true
}
</script>

<template>
  <div
    class="openpage-naive-div"
    v-bind="divProps"
  >
    {{ props.node.label }}
    <slot />
    <pre v-if="shouldShowDebugState">{{ props.context.state }}</pre>
  </div>
</template>

<style scoped>
.openpage-naive-div {
  width: 100%;
}
</style>
