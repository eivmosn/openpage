<script setup lang="ts">
import type { OverlayItem, OverlayProviderProps } from './types'
import { computed, useTemplateRef } from 'vue'
import OverlayBody from './OverlayBody.vue'
import OverlayFooter from './OverlayFooter.vue'
import OverlayHeader from './OverlayHeader.vue'
import { resolveDrawerPosition, resolveModalPlacement } from './overlayPosition'
import { overlay } from './useOverlay'
import { useOverlayGeometry } from './useOverlayGeometry'

const props = defineProps<{
  contentWrapper?: OverlayProviderProps['contentWrapper']
  contentWrapperProps?: OverlayProviderProps['contentWrapperProps']
  drawer?: OverlayProviderProps['drawer']
  item: OverlayItem
  modal?: OverlayProviderProps['modal']
}>()

const panelRef = useTemplateRef<HTMLElement>('panel')
const geometry = useOverlayGeometry(panelRef, props.item, props)
const drawerPosition = computed(() => resolveDrawerPosition(props.item, props))
const modalPlacement = computed(() => resolveModalPlacement(props.item, props))
const headerExtra = computed(() => props.item.options.extra ?? (
  props.item.options.type === 'modal'
    ? props.modal?.extra
    : props.drawer?.extra
))
const actionClassName = computed(() => props.item.options.actionClassName ?? (
  props.item.options.type === 'modal'
    ? props.modal?.actionClassName
    : props.drawer?.actionClassName
))

const panelClass = computed(() => [
  'overlay-vue-panel',
  `overlay-vue-panel--${props.item.options.type}`,
  props.item.options.type === 'drawer'
    ? `overlay-vue-panel--${drawerPosition.value}`
    : modalPlacement.value.className,
  {
    'is-animating': geometry.animating.value,
    'is-body-full-height': props.item.options.bodyFullHeight,
    'is-dragging': geometry.dragging.value,
    'is-fullscreen': geometry.fullscreen.value,
    'is-placed': geometry.placed.value,
    'is-resizing': geometry.resizing.value,
    'is-with-footer': props.item.options.showFooter,
  },
])

const bodyClass = computed(() => [
  'overlay-vue-panel__body',
  {
    'is-full-height': props.item.options.bodyFullHeight,
    'is-no-padding': !props.item.options.bodyPadding,
    'is-scrollable': props.item.options.bodyScrollable && !props.contentWrapper,
  },
])

const visibleResizeHandles = computed(() => {
  if (props.item.options.type === 'modal') {
    return geometry.resizeHandles
  }

  if (drawerPosition.value === 'right') {
    return geometry.resizeHandles.filter(handle => handle.direction === 'w')
  }

  if (drawerPosition.value === 'left') {
    return geometry.resizeHandles.filter(handle => handle.direction === 'e')
  }

  if (drawerPosition.value === 'top') {
    return geometry.resizeHandles.filter(handle => handle.direction === 's')
  }

  return geometry.resizeHandles.filter(handle => handle.direction === 'n')
})

/** 关闭当前弹层。 */
function closeOverlay(): void {
  overlay.close(props.item.id)
}
</script>

<template>
  <section
    ref="panel"
    :class="panelClass"
    :style="geometry.panelStyle.value"
    role="dialog"
    aria-modal="true"
  >
    <header
      class="overlay-vue-panel__header"
      @mousedown.capture="geometry.startDrag"
    >
      <OverlayHeader
        :action-class-name="actionClassName"
        :closable="item.options.closable"
        :extra="headerExtra"
        :fullscreen="item.options.fullscreen"
        :is-fullscreen="geometry.fullscreen.value"
        :item="item"
        :title="item.options.title"
        :variant="item.options.type"
        @close="closeOverlay"
        @toggle-fullscreen="geometry.toggleFullscreen"
      />
    </header>

    <div :class="bodyClass" role="none">
      <component
        :is="contentWrapper"
        v-if="contentWrapper"
        v-bind="contentWrapperProps"
      >
        <div class="overlay-vue-panel__body-content">
          <OverlayBody :item="item" />
        </div>
      </component>
      <div v-else class="overlay-vue-panel__body-content">
        <OverlayBody :item="item" />
      </div>
    </div>

    <footer v-if="item.options.showFooter" class="overlay-vue-panel__footer">
      <OverlayFooter :item="item" />
    </footer>

    <template v-if="!geometry.fullscreen.value">
      <button
        v-for="handle in visibleResizeHandles"
        :key="handle.direction"
        type="button"
        class="overlay-vue-panel__resize-handle"
        :class="handle.className"
        :aria-label="`resize-${handle.direction}`"
        @pointerdown="event => geometry.startResize(event, handle.direction)"
      />
    </template>
  </section>
</template>
