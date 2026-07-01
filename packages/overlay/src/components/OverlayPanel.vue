<script setup lang="ts">
import type { OverlayItem, OverlayProviderProps } from '../types'
import { computed, onMounted, useTemplateRef } from 'vue'
import { overlay } from '../composables/useOverlay'
import { useOverlayGeometry } from '../composables/useOverlayGeometry'
import { resolveDrawerPosition, resolveModalPlacement } from '../core/overlayPosition'
import { resolveOverlayTarget } from '../core/overlayTarget'
import OverlayBody from './OverlayBody.vue'
import OverlayFooter from './OverlayFooter.vue'
import OverlayHeader from './OverlayHeader.vue'

const props = defineProps<{
  contentWrapper?: OverlayProviderProps['contentWrapper']
  contentWrapperProps?: OverlayProviderProps['contentWrapperProps']
  drawer?: OverlayProviderProps['drawer']
  item: OverlayItem
  modal?: OverlayProviderProps['modal']
}>()

const panelRef = useTemplateRef<HTMLElement>('panel')
const overlayTarget = computed(() => resolveOverlayTarget(props.item, props))
const geometry = useOverlayGeometry(panelRef, props.item, props, overlayTarget)
const drawerPosition = computed(() => resolveDrawerPosition(props.item, props))
const modalPlacement = computed(() => resolveModalPlacement(props.item, props))
const panelId = computed(() => `${props.item.id}_panel`)
const titleId = computed(() => `${props.item.id}_title`)
const bodyId = computed(() => `${props.item.id}_body`)
const descriptionId = computed(() => `${props.item.id}_description`)
const hasTitle = computed(() => props.item.options.title.trim().length > 0)
const fallbackAriaLabel = computed(() => props.item.options.ariaLabel ?? (
  props.item.options.type === 'drawer' ? '抽屉' : '弹窗'
))
const ariaLabelledBy = computed(() => hasTitle.value ? titleId.value : undefined)
const ariaLabel = computed(() => hasTitle.value ? undefined : fallbackAriaLabel.value)
const ariaDescribedBy = computed(() => props.item.options.ariaDescription ? descriptionId.value : bodyId.value)
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

onMounted(() => {
  panelRef.value?.focus()
})

/**
 * 获取 resize 句柄的可访问名称。
 *
 * @param direction resize 方向。
 * @returns 返回给辅助技术读取的操作名称。
 */
function getResizeHandleLabel(direction: string): string {
  const directionText: Record<string, string> = {
    n: '上边',
    e: '右边',
    s: '下边',
    w: '左边',
    ne: '右上角',
    nw: '左上角',
    se: '右下角',
    sw: '左下角',
  }

  return `拖拽调整${directionText[direction] ?? ''}尺寸`
}
</script>

<template>
  <section
    :id="panelId"
    ref="panel"
    :class="panelClass"
    :style="geometry.panelStyle.value"
    role="dialog"
    aria-modal="true"
    :aria-label="ariaLabel"
    :aria-labelledby="ariaLabelledBy"
    :aria-describedby="ariaDescribedBy"
    tabindex="-1"
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
        :title-id="titleId"
        :variant="item.options.type"
        @close="closeOverlay"
        @toggle-fullscreen="geometry.toggleFullscreen"
      />
    </header>

    <p
      v-if="item.options.ariaDescription"
      :id="descriptionId"
      class="overlay-vue-sr-only"
    >
      {{ item.options.ariaDescription }}
    </p>

    <main :id="bodyId" :class="bodyClass">
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
    </main>

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
        :aria-label="getResizeHandleLabel(handle.direction)"
        @pointerdown="event => geometry.startResize(event, handle.direction)"
      />
    </template>
  </section>
</template>
