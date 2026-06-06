<script lang="ts" setup>
import type { CSSProperties, StyleValue } from 'vue'
import type { ScrollbarDirection, ScrollbarProps } from './types'
import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onMounted,
  provide,
  reactive,
  ref,
  watch,
} from 'vue'
import Bar from './bar.vue'
import { useEventListener, useResizeObserver } from './composables'
import { scrollbarContextKey } from './constants'

import {
  addUnit,
  debugWarn,
  isGreaterThan,
  isNumber,
  isObject,
} from './helpers'
import { scrollbarCls } from './util'

defineOptions({
  name: 'SingleScrollbar',
})

const props = withDefaults(defineProps<ScrollbarProps>(), {
  distance: 0,
  height: '',
  maxHeight: '',
  wrapStyle: '',
  wrapClass: '',
  viewStyle: '',
  viewClass: '',
  tag: 'div',
  minSize: 20,
  tabindex: undefined,
  native: false,
  noresize: false,
  always: false,
})

const emit = defineEmits<{
  scroll: [{ scrollTop: number, scrollLeft: number }]
  endReached: [direction: ScrollbarDirection]
}>()

const COMPONENT_NAME = 'SingleScrollbar'

let stopResizeObserver: (() => void) | undefined
let stopWrapResizeObserver: (() => void) | undefined
let stopResizeListener: (() => void) | undefined
let scrollRaf = 0
let updateRaf = 0
let wrapScrollTop = 0
let wrapScrollLeft = 0
let direction = '' as ScrollbarDirection
const distanceScrollState: Record<ScrollbarDirection, boolean> = {
  bottom: false,
  top: false,
  right: false,
  left: false,
}

const scrollbarRef = ref<HTMLDivElement>()
const wrapRef = ref<HTMLDivElement>()
const resizeRef = ref<HTMLElement>()
const barRef = ref<InstanceType<typeof Bar>>()

const wrapStyle = computed<StyleValue>(() => {
  const style: CSSProperties = {}
  const height = addUnit(props.height)
  const maxHeight = addUnit(props.maxHeight)

  if (height)
    style.height = height
  if (maxHeight)
    style.maxHeight = maxHeight

  return [props.wrapStyle, style]
})

const wrapKls = computed(() => [
  props.wrapClass,
  scrollbarCls.element('wrap'),
  { [scrollbarCls.elementModifier('wrap', 'hidden-default')]: !props.native },
])

const resizeKls = computed(() => [scrollbarCls.element('view'), props.viewClass])

function shouldSkipDirection(currentDirection: ScrollbarDirection) {
  return distanceScrollState[currentDirection] ?? false
}

const DIRECTION_PAIRS: Record<ScrollbarDirection, ScrollbarDirection> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
}

function updateTriggerStatus(arrivedStates: Record<ScrollbarDirection, boolean>) {
  const oppositeDirection = DIRECTION_PAIRS[direction]
  if (!oppositeDirection)
    return

  const arrived = arrivedStates[direction]
  const oppositeArrived = arrivedStates[oppositeDirection]

  if (arrived && !distanceScrollState[direction]) {
    distanceScrollState[direction] = true
  }

  if (!oppositeArrived && distanceScrollState[oppositeDirection]) {
    distanceScrollState[oppositeDirection] = false
  }
}

function cancelScrollFrame() {
  if (!scrollRaf)
    return
  cancelAnimationFrame(scrollRaf)
  scrollRaf = 0
}

function cancelUpdateFrame() {
  if (!updateRaf)
    return
  cancelAnimationFrame(updateRaf)
  updateRaf = 0
}

function syncScrollState(wrap: HTMLDivElement) {
  barRef.value?.handleScroll(wrap)

  const prevTop = wrapScrollTop
  const prevLeft = wrapScrollLeft
  wrapScrollTop = wrap.scrollTop
  wrapScrollLeft = wrap.scrollLeft

  const arrivedStates: Record<ScrollbarDirection, boolean> = {
    bottom: !isGreaterThan(
      wrap.scrollHeight - props.distance,
      wrap.clientHeight + wrapScrollTop,
    ),
    top: wrapScrollTop <= props.distance && prevTop !== 0,
    right:
      !isGreaterThan(
        wrap.scrollWidth - props.distance,
        wrap.clientWidth + wrapScrollLeft,
      ) && prevLeft !== wrapScrollLeft,
    left: wrapScrollLeft <= props.distance && prevLeft !== 0,
  }

  emit('scroll', {
    scrollTop: wrapScrollTop,
    scrollLeft: wrapScrollLeft,
  })

  if (prevTop !== wrapScrollTop) {
    direction = wrapScrollTop > prevTop ? 'bottom' : 'top'
  }
  if (prevLeft !== wrapScrollLeft) {
    direction = wrapScrollLeft > prevLeft ? 'right' : 'left'
  }

  if (props.distance > 0) {
    if (shouldSkipDirection(direction))
      return
    updateTriggerStatus(arrivedStates)
  }

  if (arrivedStates[direction]) {
    emit('endReached', direction)
  }
}

function handleScroll() {
  if (!wrapRef.value || scrollRaf)
    return

  scrollRaf = requestAnimationFrame(() => {
    scrollRaf = 0
    if (!wrapRef.value)
      return
    syncScrollState(wrapRef.value)
  })
}

function scrollTo(xCord: number, yCord?: number): void
function scrollTo(options: ScrollToOptions): void
function scrollTo(arg1: unknown, arg2?: number) {
  if (!wrapRef.value)
    return

  if (isObject(arg1)) {
    wrapRef.value.scrollTo(arg1 as ScrollToOptions)
  }
  else if (isNumber(arg1) && isNumber(arg2)) {
    wrapRef.value.scrollTo(arg1, arg2)
  }
}

function setScrollTop(value: number) {
  if (!isNumber(value)) {
    debugWarn(COMPONENT_NAME, 'value must be a number')
    return
  }
  if (wrapRef.value)
    wrapRef.value.scrollTop = value
}

function setScrollLeft(value: number) {
  if (!isNumber(value)) {
    debugWarn(COMPONENT_NAME, 'value must be a number')
    return
  }
  if (wrapRef.value)
    wrapRef.value.scrollLeft = value
}

function update() {
  barRef.value?.update()
  if (direction)
    distanceScrollState[direction] = false
  if (wrapRef.value)
    barRef.value?.handleScroll(wrapRef.value)
}

function scheduleUpdate() {
  if (props.native || updateRaf)
    return

  updateRaf = requestAnimationFrame(() => {
    updateRaf = 0
    update()
  })
}

watch(
  () => props.noresize,
  (noresize) => {
    stopResizeObserver?.()
    stopWrapResizeObserver?.()
    stopResizeListener?.()

    if (!noresize) {
      ;({ stop: stopResizeObserver } = useResizeObserver(resizeRef, scheduleUpdate))
      ;({ stop: stopWrapResizeObserver } = useResizeObserver(wrapRef, scheduleUpdate))
      stopResizeListener = useEventListener('resize', scheduleUpdate)
    }
  },
  { immediate: true },
)

watch(
  () => [props.maxHeight, props.height, props.minSize, props.native],
  () => {
    if (!props.native) {
      nextTick(() => scheduleUpdate())
    }
  },
)

provide(
  scrollbarContextKey,
  reactive({
    scrollbarElement: scrollbarRef,
    wrapElement: wrapRef,
  }),
)

onActivated(() => {
  if (wrapRef.value) {
    wrapRef.value.scrollTop = wrapScrollTop
    wrapRef.value.scrollLeft = wrapScrollLeft
  }
})

onMounted(() => {
  if (!props.native) {
    nextTick(() => scheduleUpdate())
  }
})

onBeforeUnmount(() => {
  cancelScrollFrame()
  cancelUpdateFrame()
})

defineExpose({
  wrapRef,
  update,
  scrollTo,
  setScrollTop,
  setScrollLeft,
  handleScroll,
})
</script>

<template>
  <div ref="scrollbarRef" :class="scrollbarCls.block()">
    <div
      ref="wrapRef"
      :class="wrapKls"
      :style="wrapStyle"
      :tabindex="tabindex"
      @scroll="handleScroll"
    >
      <component
        :is="tag"
        :id="id"
        ref="resizeRef"
        :class="resizeKls"
        :style="viewStyle"
        :role="role"
        :aria-label="ariaLabel"
        :aria-orientation="ariaOrientation"
      >
        <slot />
      </component>
    </div>
    <template v-if="!native">
      <Bar ref="barRef" :always="always" :min-size="minSize" />
    </template>
  </div>
</template>
