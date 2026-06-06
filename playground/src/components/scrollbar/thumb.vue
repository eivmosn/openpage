<script lang="ts" setup>
import type { ThumbProps } from './types'
import { computed, inject, onBeforeUnmount, ref, toRef } from 'vue'
import { useEventListener } from './composables'
import { scrollbarContextKey } from './constants'
import { isClient, throwError } from './helpers'

import { BAR_MAP, scrollbarCls } from './util'

const props = withDefaults(defineProps<ThumbProps>(), {
  vertical: false,
  always: false,
})

const COMPONENT_NAME = 'SingleScrollbarThumb'

const scrollbar = inject(scrollbarContextKey)

if (!scrollbar) {
  throwError(COMPONENT_NAME, 'can not inject scrollbar context')
}

const instance = ref<HTMLDivElement>()
const thumb = ref<HTMLDivElement>()

const thumbState = ref<Partial<Record<'X' | 'Y', number>>>({})
const visible = ref(false)

let cursorDown = false
let cursorLeave = false
let baseScrollHeight = 0
let baseScrollWidth = 0
let dragRaf = 0
let dragTrackOffset = 0
let dragTrackSize = 0
let dragOffsetRatio = 1
let pendingClient = 0
let currentRatio = 1
let currentSize = ''
let originalOnSelectStart:
  | ((this: GlobalEventHandlers, ev: Event) => unknown)
  | null = isClient ? document.onselectstart : null

const bar = computed(() => BAR_MAP[props.vertical ? 'vertical' : 'horizontal'])

function applyThumbMove(move: number) {
  if (!thumb.value)
    return
  thumb.value.style.transform = `translate${bar.value.axis}(${move}%)`
}

function applyThumbSize(size: string) {
  currentSize = size
  if (!thumb.value)
    return
  thumb.value.style[bar.value.size as 'width' | 'height'] = size
}

function syncThumb(size: string, ratio: number) {
  currentRatio = ratio
  if (currentSize !== size) {
    applyThumbSize(size)
  }
  else if (thumb.value) {
    thumb.value.style[bar.value.size as 'width' | 'height'] = size
  }

  if (!size) {
    visible.value = false
  }
}

function getOffsetRatio() {
  if (!instance.value || !thumb.value || !scrollbar?.wrapElement)
    return 1

  return (
    instance.value[bar.value.offset] ** 2
    / scrollbar.wrapElement[bar.value.scrollSize]
    / currentRatio
    / thumb.value[bar.value.offset]
  )
}

function clickThumbHandler(event: MouseEvent) {
  event.stopPropagation()
  if (event.ctrlKey || [1, 2].includes(event.button))
    return

  window.getSelection()?.removeAllRanges()
  startDrag(event)

  const el = event.currentTarget as HTMLDivElement | null
  if (!el)
    return

  thumbState.value[bar.value.axis]
    = el[bar.value.offset]
      - (event[bar.value.client] - el.getBoundingClientRect()[bar.value.direction])
}

function clickTrackHandler(event: MouseEvent) {
  if (!thumb.value || !instance.value || !scrollbar?.wrapElement)
    return

  const offset = Math.abs(
    (event.target as HTMLElement).getBoundingClientRect()[bar.value.direction]
    - event[bar.value.client],
  )
  const thumbHalf = thumb.value[bar.value.offset] / 2
  const thumbPositionPercentage
    = ((offset - thumbHalf) * 100 * getOffsetRatio())
      / instance.value[bar.value.offset]

  scrollbar.wrapElement[bar.value.scroll]
    = (thumbPositionPercentage * scrollbar.wrapElement[bar.value.scrollSize]) / 100
}

function cancelDragFrame() {
  if (!dragRaf)
    return
  cancelAnimationFrame(dragRaf)
  dragRaf = 0
}

function syncDragState() {
  if (!instance.value || !thumb.value || !scrollbar?.wrapElement || !cursorDown)
    return

  const prevPage = thumbState.value[bar.value.axis]
  if (!prevPage)
    return

  const offset = pendingClient - dragTrackOffset
  const thumbClickPosition = thumb.value[bar.value.offset] - prevPage
  const thumbPositionPercentage
    = ((offset - thumbClickPosition) * 100 * dragOffsetRatio) / dragTrackSize

  if (bar.value.scroll === 'scrollLeft') {
    scrollbar.wrapElement[bar.value.scroll]
      = (thumbPositionPercentage * baseScrollWidth) / 100
  }
  else {
    scrollbar.wrapElement[bar.value.scroll]
      = (thumbPositionPercentage * baseScrollHeight) / 100
  }
}

function startDrag(event: MouseEvent) {
  if (!instance.value || !scrollbar?.wrapElement)
    return

  event.stopImmediatePropagation()
  cursorDown = true
  baseScrollHeight = scrollbar.wrapElement.scrollHeight
  baseScrollWidth = scrollbar.wrapElement.scrollWidth
  dragTrackOffset = instance.value.getBoundingClientRect()[bar.value.direction]
  dragTrackSize = instance.value[bar.value.offset]
  dragOffsetRatio = getOffsetRatio()
  document.addEventListener('mousemove', mouseMoveDocumentHandler)
  document.addEventListener('mouseup', mouseUpDocumentHandler)
  originalOnSelectStart = document.onselectstart
  document.onselectstart = () => false
}

function mouseMoveDocumentHandler(event: MouseEvent) {
  if (!cursorDown)
    return

  pendingClient = event[bar.value.client]
  if (dragRaf)
    return

  dragRaf = requestAnimationFrame(() => {
    dragRaf = 0
    syncDragState()
  })
}

function mouseUpDocumentHandler() {
  cursorDown = false
  thumbState.value[bar.value.axis] = 0
  cancelDragFrame()
  document.removeEventListener('mousemove', mouseMoveDocumentHandler)
  document.removeEventListener('mouseup', mouseUpDocumentHandler)
  restoreOnselectstart()
  if (cursorLeave)
    visible.value = false
}

function mouseMoveScrollbarHandler() {
  cursorLeave = false
  visible.value = !!currentSize
}

function mouseLeaveScrollbarHandler() {
  cursorLeave = true
  visible.value = cursorDown
}

function restoreOnselectstart() {
  if (document.onselectstart !== originalOnSelectStart) {
    document.onselectstart = originalOnSelectStart
  }
}

onBeforeUnmount(() => {
  cancelDragFrame()
  restoreOnselectstart()
  document.removeEventListener('mousemove', mouseMoveDocumentHandler)
  document.removeEventListener('mouseup', mouseUpDocumentHandler)
})

useEventListener(
  toRef(scrollbar!, 'scrollbarElement'),
  'mousemove',
  mouseMoveScrollbarHandler,
)
useEventListener(
  toRef(scrollbar!, 'scrollbarElement'),
  'mouseleave',
  mouseLeaveScrollbarHandler,
)

defineExpose({
  setMove: applyThumbMove,
  sync: syncThumb,
})
</script>

<template>
  <transition :name="scrollbarCls.block('fade')">
    <div
      v-show="always || visible"
      ref="instance"
      :class="[scrollbarCls.element('bar'), scrollbarCls.state(bar.key)]"
      @mousedown="clickTrackHandler"
      @click.stop
    >
      <div
        ref="thumb"
        :class="scrollbarCls.element('thumb')"
        @mousedown="clickThumbHandler"
      />
    </div>
  </transition>
</template>
