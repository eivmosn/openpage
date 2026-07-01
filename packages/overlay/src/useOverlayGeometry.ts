import type { CSSProperties, Ref } from 'vue'
import type { OverlayPositionOptions } from './overlayPosition'
import type { OverlayDrawerPosition, OverlayItem, OverlayTarget } from './types'
import { computed, onBeforeUnmount, shallowRef, toValue } from 'vue'
import { isHorizontalDrawer, resolveDrawerPosition, resolveModalPlacement } from './overlayPosition'
import { isViewportOverlayTarget } from './overlayTarget'
import { clamp, formatCssUnit, isInteractiveTarget } from './utils'

type ResizeDirection = 'n' | 'e' | 's' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

interface PanelRect {
  width: number
  height: number
  left: number
  top: number
}

interface ResizeState extends PanelRect {
  direction: ResizeDirection
  startX: number
  startY: number
}

interface DragState extends PanelRect {
  startX: number
  startY: number
}

interface DragOffset {
  x: number
  y: number
}

interface BoundsRect {
  width: number
  height: number
  left: number
  top: number
}

/** 弹层几何状态控制器。 */
export interface OverlayGeometry {
  animating: Ref<boolean>
  dragging: Ref<boolean>
  fullscreen: Ref<boolean>
  panelStyle: Ref<CSSProperties>
  placed: Ref<boolean>
  resizing: Ref<boolean>
  resizeHandles: Array<{ direction: ResizeDirection, className: string }>
  startDrag: (event: MouseEvent) => void
  startResize: (event: PointerEvent, direction: ResizeDirection) => void
  toggleFullscreen: () => void
}

const resizeHandles: OverlayGeometry['resizeHandles'] = [
  { direction: 'n', className: 'is-n' },
  { direction: 'e', className: 'is-e' },
  { direction: 's', className: 'is-s' },
  { direction: 'w', className: 'is-w' },
  { direction: 'ne', className: 'is-ne' },
  { direction: 'nw', className: 'is-nw' },
  { direction: 'se', className: 'is-se' },
  { direction: 'sw', className: 'is-sw' },
]

/**
 * 创建弹层拖拽、resize 和全屏控制。
 *
 * @param panelRef 弹层 DOM 引用。
 * @param item 当前弹层实例。
 * @param options 弹层全局几何配置。
 * @param target 弹层挂载目标，用于计算局部拖拽和全屏边界。
 * @returns 返回弹层几何状态控制器。
 */
export function useOverlayGeometry(
  panelRef: Ref<HTMLElement | null>,
  item: OverlayItem,
  options: OverlayPositionOptions = {},
  target?: Ref<OverlayTarget>,
): OverlayGeometry {
  const widthPx = shallowRef<number>()
  const heightPx = shallowRef<number>()
  const leftPx = shallowRef<number>()
  const topPx = shallowRef<number>()
  const translateX = shallowRef(0)
  const translateY = shallowRef(0)
  const resizing = shallowRef(false)
  const dragging = shallowRef(false)
  const animating = shallowRef(false)
  const fullscreen = shallowRef(false)
  let resizeState: ResizeState | undefined
  let dragState: DragState | undefined
  let restoreRect: PanelRect | undefined
  let pendingDragOffset: DragOffset | undefined
  let animationFrameId = 0
  let animationTimer = 0
  let interactionFrameId = 0

  const placed = computed(() => leftPx.value !== undefined && topPx.value !== undefined)

  const panelStyle = computed<CSSProperties>(() => {
    const style: CSSProperties = {
      zIndex: item.panelZIndex,
    }

    if (item.options.type === 'drawer') {
      applyOverlayRadius(style, item, '--overlay-vue-radius')
      applyDrawerSize(style, resolveDrawerPosition(item, options), widthPx.value, heightPx.value, item)
      return style
    }

    applyOverlayRadius(style, item, '--overlay-vue-modal-radius')
    style.width = widthPx.value === undefined ? formatCssUnit(item.options.width) : `${widthPx.value}px`
    style.minWidth = `${item.options.minWidth}px`
    style.minHeight = `${item.options.minHeight}px`

    if (heightPx.value !== undefined || item.options.height) {
      style.height = heightPx.value === undefined ? formatCssUnit(item.options.height) : `${heightPx.value}px`
    }

    if (!placed.value) {
      Object.assign(style, resolveModalPlacement(item, options).style)
    }

    if (placed.value) {
      style.left = `${leftPx.value}px`
      style.margin = '0'
      style.maxHeight = 'none'
      style.maxWidth = 'none'
      style.top = `${topPx.value}px`

      if (dragging.value) {
        style.transform = `translate3d(${translateX.value}px, ${translateY.value}px, 0)`
      }
    }

    return style
  })

  /**
   * 开始 resize 弹层。
   *
   * @param event 指针按下事件。
   * @param direction resize 方向。
   */
  function startResize(event: PointerEvent, direction: ResizeDirection): void {
    if (!item.options.resizable || fullscreen.value || !panelRef.value) {
      return
    }

    const rect = readPanelRect()

    if (!rect) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    resizeState = { ...rect, direction, startX: event.clientX, startY: event.clientY }
    clearFullscreenAnimation()
    syncRect(rect)
    resizing.value = true
    fullscreen.value = false
    window.addEventListener('pointermove', handleResizeMove)
    window.addEventListener('pointerup', stopResize)
    window.addEventListener('pointercancel', stopResize)
  }

  /**
   * 拖动 resize 手柄时更新尺寸。
   *
   * @param event 指针移动事件。
   */
  function handleResizeMove(event: PointerEvent): void {
    if (!resizeState) {
      return
    }

    const rect = getResizedRect(resizeState, event, item.options.minWidth, item.options.minHeight, getBoundsRect())
    syncRect(rect)
  }

  /** 停止 resize 并释放事件。 */
  function stopResize(): void {
    resizing.value = false
    resizeState = undefined
    window.removeEventListener('pointermove', handleResizeMove)
    window.removeEventListener('pointerup', stopResize)
    window.removeEventListener('pointercancel', stopResize)
  }

  /**
   * 从标题栏开始拖拽 modal。
   *
   * @param event 鼠标按下事件。
   */
  function startDrag(event: MouseEvent): void {
    if (item.options.type !== 'modal' || fullscreen.value || isInteractiveTarget(event.target)) {
      return
    }

    const rect = readPanelRect()

    if (!rect) {
      return
    }

    event.preventDefault()
    dragState = { ...rect, startX: event.clientX, startY: event.clientY }
    clearFullscreenAnimation()
    syncRect(rect)
    dragging.value = true
    window.addEventListener('mousemove', handleDragMove)
    window.addEventListener('mouseup', stopDrag)
  }

  /**
   * 拖动标题栏时更新 modal 位置。
   *
   * @param event 鼠标移动事件。
   */
  function handleDragMove(event: MouseEvent): void {
    if (!dragState) {
      return
    }

    const offset = getDragOffset(dragState, event, getBoundsRect())

    scheduleDragOffset(offset)
  }

  /** 停止拖拽并释放事件。 */
  function stopDrag(): void {
    flushInteractionFrame()
    commitDragOffset()
    dragging.value = false
    dragState = undefined
    window.removeEventListener('mousemove', handleDragMove)
    window.removeEventListener('mouseup', stopDrag)
  }

  /** 切换弹层全屏状态。 */
  function toggleFullscreen(): void {
    const rect = readPanelRect()

    if (!rect) {
      return
    }

    if (!fullscreen.value) {
      restoreRect = rect
      fullscreen.value = true
      animateToRect(createFullscreenRect())
      return
    }

    fullscreen.value = false

    if (restoreRect) {
      animateToRect(restoreRect)
    }
  }

  /**
   * 读取当前弹层矩形。
   *
   * @returns 返回当前弹层矩形。
   */
  function readPanelRect(): PanelRect | undefined {
    if (!panelRef.value) {
      return undefined
    }

    const rect = panelRef.value.getBoundingClientRect()

    return {
      width: rect.width,
      height: rect.height,
      left: rect.left,
      top: rect.top,
    }
  }

  /**
   * 同步弹层矩形到响应式状态。
   *
   * @param rect 需要同步的弹层矩形。
   */
  function syncRect(rect: PanelRect): void {
    const bounds = getBoundsRect()

    widthPx.value = rect.width
    heightPx.value = rect.height
    leftPx.value = rect.left - bounds.left
    topPx.value = rect.top - bounds.top
    resetDragOffset()
  }

  /** 将当前拖拽 transform 偏移提交为布局坐标。 */
  function commitDragOffset(): void {
    if (leftPx.value !== undefined) {
      leftPx.value += translateX.value
    }

    if (topPx.value !== undefined) {
      topPx.value += translateY.value
    }

    resetDragOffset()
  }

  /** 重置拖拽 transform 偏移量。 */
  function resetDragOffset(): void {
    translateX.value = 0
    translateY.value = 0
  }

  /**
   * 将拖拽偏移安排到下一帧提交。
   *
   * @param offset 最新拖拽偏移。
   */
  function scheduleDragOffset(offset: DragOffset): void {
    pendingDragOffset = offset
    requestInteractionFrame()
  }

  /** 请求下一帧提交交互状态。 */
  function requestInteractionFrame(): void {
    if (interactionFrameId) {
      return
    }

    interactionFrameId = window.requestAnimationFrame(() => {
      interactionFrameId = 0
      flushPendingInteraction()
    })
  }

  /** 立即提交待处理的交互状态。 */
  function flushInteractionFrame(): void {
    if (interactionFrameId) {
      window.cancelAnimationFrame(interactionFrameId)
      interactionFrameId = 0
    }

    flushPendingInteraction()
  }

  /** 提交 resize 或拖拽的最新待处理状态。 */
  function flushPendingInteraction(): void {
    if (pendingDragOffset) {
      translateX.value = pendingDragOffset.x
      translateY.value = pendingDragOffset.y
      pendingDragOffset = undefined
    }
  }

  /** 清理全屏切换动画的帧任务和定时器。 */
  function clearFullscreenAnimation(): void {
    if (animationFrameId) {
      window.cancelAnimationFrame(animationFrameId)
      animationFrameId = 0
    }

    if (animationTimer) {
      window.clearTimeout(animationTimer)
      animationTimer = 0
    }

    flushInteractionFrame()
    animating.value = false
  }

  /**
   * 将弹层从当前矩形动画过渡到目标矩形。
   *
   * @param target 目标矩形。
   */
  function animateToRect(target: PanelRect): void {
    const current = readPanelRect()

    if (!current) {
      syncRect(target)
      return
    }

    clearFullscreenAnimation()
    syncRect(current)

    animationFrameId = window.requestAnimationFrame(() => {
      animationFrameId = 0
      animating.value = true
      syncRect(target)
    })

    animationTimer = window.setTimeout(() => {
      animating.value = false
      animationTimer = 0
    }, 240)
  }

  /**
   * 创建当前弹层全屏后的目标矩形。
   *
   * @returns 返回覆盖视口的矩形。
   */
  function createFullscreenRect(): PanelRect {
    const bounds = getBoundsRect()

    return {
      left: bounds.left,
      top: bounds.top,
      width: Math.max(item.options.minWidth, bounds.width),
      height: Math.max(item.options.minHeight, bounds.height),
    }
  }

  /**
   * 获取当前弹层可活动边界。
   *
   * @returns 返回视口或本地挂载容器的矩形。
   */
  function getBoundsRect(): BoundsRect {
    const currentTarget = target ? toValue(target) : undefined

    if (isViewportOverlayTarget(currentTarget)) {
      return toBoundsRect(undefined, window.innerWidth, window.innerHeight)
    }

    const targetElement = resolveTargetElement(currentTarget)

    return toBoundsRect(targetElement?.getBoundingClientRect(), window.innerWidth, window.innerHeight)
  }

  onBeforeUnmount(() => {
    flushInteractionFrame()
    clearFullscreenAnimation()
    stopResize()
    stopDrag()
  })

  return {
    animating,
    dragging,
    fullscreen,
    panelStyle,
    placed,
    resizing,
    resizeHandles,
    startDrag,
    startResize,
    toggleFullscreen,
  }
}

/**
 * 将单个弹层圆角配置写入样式变量。
 *
 * @param style 待写入的样式对象。
 * @param item 当前弹层实例。
 * @param property 圆角 CSS 变量名。
 */
function applyOverlayRadius(style: CSSProperties, item: OverlayItem, property: '--overlay-vue-radius' | '--overlay-vue-modal-radius'): void {
  const radius = formatCssUnit(item.options.radius)

  if (radius) {
    style[property] = radius
  }
}

/**
 * 将 drawer 尺寸写入样式对象。
 *
 * @param style 待写入的样式对象。
 * @param position drawer 弹出方向。
 * @param widthPx 当前宽度像素。
 * @param heightPx 当前高度像素。
 * @param item 当前弹层实例。
 */
function applyDrawerSize(style: CSSProperties, position: OverlayDrawerPosition, widthPx: number | undefined, heightPx: number | undefined, item: OverlayItem): void {
  if (!isHorizontalDrawer(position)) {
    style.height = heightPx === undefined ? formatCssUnit(item.options.height || 251) : `${heightPx}px`
    return
  }

  style.width = widthPx === undefined ? formatCssUnit(item.options.width) : `${widthPx}px`
}

/**
 * 根据 resize 状态计算下一帧矩形。
 *
 * @param state resize 初始状态。
 * @param event 指针移动事件。
 * @param minWidth 最小宽度。
 * @param minHeight 最小高度。
 * @returns 返回 resize 后的矩形。
 */
function getResizedRect(state: ResizeState, event: PointerEvent, minWidth: number, minHeight: number, bounds: BoundsRect): PanelRect {
  const deltaX = event.clientX - state.startX
  const deltaY = event.clientY - state.startY
  let width = state.width
  let height = state.height
  let left = state.left
  let top = state.top

  if (state.direction.includes('e')) {
    width = clamp(state.width + deltaX, minWidth, bounds.left + bounds.width - state.left)
  }

  if (state.direction.includes('s')) {
    height = clamp(state.height + deltaY, minHeight, bounds.top + bounds.height - state.top)
  }

  if (state.direction.includes('w')) {
    width = clamp(state.width - deltaX, minWidth, state.left + state.width - bounds.left)
    left = state.left + state.width - width
  }

  if (state.direction.includes('n')) {
    height = clamp(state.height - deltaY, minHeight, state.top + state.height - bounds.top)
    top = state.top + state.height - height
  }

  return { width, height, left, top }
}

/**
 * 根据拖拽状态计算 transform 偏移量。
 *
 * @param state 拖拽初始状态。
 * @param event 鼠标移动事件。
 * @param bounds 弹层可活动边界。
 * @returns 返回用于 translate3d 的偏移量。
 */
function getDragOffset(state: DragState, event: MouseEvent, bounds: BoundsRect): DragOffset {
  const nextRect = clampPanelRectToBounds({
    height: state.height,
    left: state.left + event.clientX - state.startX,
    top: state.top + event.clientY - state.startY,
    width: state.width,
  }, bounds)

  return {
    x: nextRect.left - state.left,
    y: nextRect.top - state.top,
  }
}

/**
 * 将 DOMRect 转成几何边界，未传入时使用视口尺寸。
 *
 * @param rect 本地挂载目标矩形。
 * @param viewportWidth 视口宽度。
 * @param viewportHeight 视口高度。
 * @returns 返回可用于几何计算的边界。
 */
export function toBoundsRect(rect: Pick<DOMRect, 'height' | 'left' | 'top' | 'width'> | undefined, viewportWidth: number, viewportHeight: number): BoundsRect {
  return {
    height: rect?.height ?? viewportHeight,
    left: rect?.left ?? 0,
    top: rect?.top ?? 0,
    width: rect?.width ?? viewportWidth,
  }
}

/**
 * 将面板矩形限制在指定边界内。
 *
 * @param rect 面板矩形。
 * @param bounds 可活动边界。
 * @returns 返回被边界裁剪后的矩形。
 */
export function clampPanelRectToBounds(rect: PanelRect, bounds: BoundsRect): PanelRect {
  return {
    height: rect.height,
    left: clamp(rect.left, bounds.left, bounds.left + bounds.width - rect.width),
    top: clamp(rect.top, bounds.top, bounds.top + bounds.height - rect.height),
    width: rect.width,
  }
}

/**
 * 从 Teleport 目标解析 DOM 元素。
 *
 * @param target Teleport 挂载目标。
 * @returns 返回可读取矩形的元素。
 */
function resolveTargetElement(target: OverlayTarget): HTMLElement | undefined {
  if (typeof document === 'undefined' || typeof HTMLElement === 'undefined') {
    return undefined
  }

  if (typeof target === 'string') {
    const element = document.querySelector(target)

    return element instanceof HTMLElement ? element : undefined
  }

  return target instanceof HTMLElement ? target : undefined
}
