<script setup lang="ts">
import type { UiComponentProps } from '../../types'
import { computed, mergeProps, useAttrs } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<UiComponentProps>()
const attrs = useAttrs()

const divProps = computed(resolveDivProps)

/**
 * 解析容器透传属性。
 *
 * @returns 返回容器透传属性。
 */
function resolveDivProps(): Record<string, unknown> {
  return mergeProps(attrs, props.component.props)
}
</script>

<template>
  <div
    class="openpage-naive-div"
    v-bind="divProps"
  >
    {{ props.component.label }}
    <slot />
  </div>
</template>

<style scoped>
.openpage-naive-div {
  width: 100%;
}
</style>
