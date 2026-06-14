<script setup lang="ts">
import { computed } from 'vue'
import CloseIcon from './CloseIcon.vue'
import FullscreenIcon from './FullscreenIcon.vue'
import OffscreenIcon from './OffscreenIcon.vue'

const props = withDefaults(defineProps<{
  title?: string
  variant?: 'modal' | 'drawer'
  closable?: boolean
  fullscreen?: boolean
  isFullscreen?: boolean
}>(), {
  title: '',
  variant: 'modal',
  closable: true,
  fullscreen: true,
  isFullscreen: false,
})

const emit = defineEmits<{
  close: []
  toggleFullscreen: []
}>()

const iconButtonClass = computed(() => [
  'op-overlay-header__button',
  `op-overlay-header__button--${props.variant}`,
])

/**
 * 双击标题栏时切换全屏。
 *
 * @param event 鼠标双击事件。
 */
function handleDoubleClick(event: MouseEvent): void {
  if (!props.fullscreen) {
    return
  }

  const target = event.target

  if (target instanceof Element && target.closest('button')) {
    return
  }

  emit('toggleFullscreen')
}
</script>

<template>
  <div class="op-overlay-header" @dblclick.stop="handleDoubleClick">
    <div class="op-overlay-header__title">
      {{ title }}
    </div>
    <div class="op-overlay-header__actions">
      <button
        v-if="fullscreen"
        :class="iconButtonClass"
        type="button"
        aria-label="切换全屏"
        @click.stop="emit('toggleFullscreen')"
      >
        <OffscreenIcon v-if="isFullscreen" />
        <FullscreenIcon v-else />
      </button>
      <button
        v-if="closable"
        :class="iconButtonClass"
        type="button"
        aria-label="关闭"
        @click.stop="emit('close')"
      >
        <CloseIcon />
      </button>
    </div>
  </div>
</template>
