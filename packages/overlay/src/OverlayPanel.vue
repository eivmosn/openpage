<script setup lang="ts">
import type { OverlayItem, OverlayProviderProps } from './types'
import { computed, useTemplateRef } from 'vue'
import OverlayBody from './OverlayBody.vue'
import OverlayFooter from './OverlayFooter.vue'
import OverlayHeader from './OverlayHeader.vue'
import { overlay } from './useOverlay'
import { useOverlayGeometry } from './useOverlayGeometry'

const props = defineProps<{
  contentWrapper?: OverlayProviderProps['contentWrapper']
  contentWrapperProps?: OverlayProviderProps['contentWrapperProps']
  item: OverlayItem
}>()

const panelRef = useTemplateRef<HTMLElement>('panel')
const geometry = useOverlayGeometry(panelRef, props.item)

const panelClass = computed(() => [
  'op-overlay-panel',
  `op-overlay-panel--${props.item.options.type}`,
  `op-overlay-panel--${props.item.options.placement}`,
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
  'op-overlay-panel__body',
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

  if (props.item.options.placement === 'right') {
    return geometry.resizeHandles.filter(handle => handle.direction === 'w')
  }

  if (props.item.options.placement === 'left') {
    return geometry.resizeHandles.filter(handle => handle.direction === 'e')
  }

  if (props.item.options.placement === 'top') {
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
      class="op-overlay-panel__header"
      @mousedown.capture="geometry.startDrag"
    >
      <OverlayHeader
        :closable="item.options.closable"
        :fullscreen="item.options.fullscreen"
        :is-fullscreen="geometry.fullscreen.value"
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
        <div class="op-overlay-panel__body-content">
          <OverlayBody :item="item" />
        </div>
      </component>
      <div v-else class="op-overlay-panel__body-content">
        <OverlayBody :item="item" />
      </div>
    </div>

    <footer v-if="item.options.showFooter" class="op-overlay-panel__footer">
      <OverlayFooter :item="item" />
    </footer>

    <template v-if="!geometry.fullscreen.value">
      <button
        v-for="handle in visibleResizeHandles"
        :key="handle.direction"
        type="button"
        class="op-overlay-panel__resize-handle"
        :class="handle.className"
        :aria-label="`resize-${handle.direction}`"
        @pointerdown="event => geometry.startResize(event, handle.direction)"
      />
    </template>
  </section>
</template>
