<script setup lang="ts">
import type { OverlayHeaderExtraRenderer, OverlayItem } from '../types'
import { computed, h } from 'vue'
import CloseIcon from './icons/CloseIcon.vue'
import FullscreenIcon from './icons/FullscreenIcon.vue'
import OffscreenIcon from './icons/OffscreenIcon.vue'
import OverlayRenderContent from './OverlayRenderContent'

const props = withDefaults(defineProps<{
  actionClassName?: string
  extra?: OverlayHeaderExtraRenderer
  titleId?: string
  title?: string
  item: OverlayItem
  variant?: 'modal' | 'drawer'
  closable?: boolean
  fullscreen?: boolean
  isFullscreen?: boolean
}>(), {
  actionClassName: undefined,
  extra: undefined,
  titleId: undefined,
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
  props.actionClassName ?? 'overlay-vue-header__button',
  `overlay-vue-header__button--${props.variant}`,
])

const fullscreenButton = computed(() => props.fullscreen
  ? h('button', {
      'class': iconButtonClass.value,
      'type': 'button',
      'aria-label': '切换全屏',
      'onClick': (event: MouseEvent) => {
        event.stopPropagation()
        emit('toggleFullscreen')
      },
    }, [props.isFullscreen ? h(OffscreenIcon) : h(FullscreenIcon)])
  : undefined)

const closeButton = computed(() => props.closable
  ? h('button', {
      'class': iconButtonClass.value,
      'type': 'button',
      'aria-label': '关闭',
      'onClick': (event: MouseEvent) => {
        event.stopPropagation()
        emit('close')
      },
    }, [h(CloseIcon)])
  : undefined)

const extraContent = computed(() => props.extra?.({
  item: props.item,
  type: props.variant,
  className: props.actionClassName ?? 'overlay-vue-header__button',
  buttonClass: iconButtonClass.value,
  isFullscreen: props.isFullscreen,
  fullscreen: fullscreenButton.value,
  close: closeButton.value,
  toggleFullscreen: () => emit('toggleFullscreen'),
  closeOverlay: () => emit('close'),
}))

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
  <div class="overlay-vue-header" @dblclick.stop="handleDoubleClick">
    <h2
      v-if="title"
      :id="titleId"
      class="overlay-vue-header__title"
    >
      {{ title }}
    </h2>
    <div v-else class="overlay-vue-header__title" aria-hidden="true" />
    <div class="overlay-vue-header__actions">
      <OverlayRenderContent v-if="extraContent" :content="extraContent" />
      <template v-else>
        <OverlayRenderContent v-if="fullscreenButton" :content="fullscreenButton" />
        <OverlayRenderContent v-if="closeButton" :content="closeButton" />
      </template>
    </div>
  </div>
</template>
