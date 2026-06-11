<script setup lang="ts">
import type { UiComponentProps } from '../../types'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<UiComponentProps>()
</script>

<template>
  <div
    class="openpage-div"
    :class="[
      props.component.interactionClassName,
    ]"
    v-bind="props.component.props"
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
