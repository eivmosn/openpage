import type { CSSProperties, Ref } from 'vue'
import type { OverlayItem, OverlayPlacement } from './types'
import { computed, onBeforeUnmount, shallowRef } from 'vue'
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
 * @returns 返回弹层几何状态控制器。
 */
export function useOverlayGeometry(panelRef: Ref<HTMLElement | null>, item: OverlayItem): OverlayGeometry {
  const widthPx = shallowRef<number>()
  const heightPx = shallowRef<number>()
  const leftPx = shallowRef<number>()
  const topPx = shallowRef<number>()
  const resizing = shallowRef(false)
  const dragging = shallowRef(false)
  const animating = shallowRef(false)
  const fullscreen = shallowRef(false)
  let resizeState: ResizeState | undefined
  let dragState: DragState | undefined
  let restoreRect: PanelRect | undefined
  let animationFrameId = 0
  let animationTimer = 0

  const placed = computed(() => leftPx.value !== undefined && topPx.value !== undefined)

  const panelStyle = computed<CSSProperties>(() => {
    const style: CSSProperties = {
      zIndex: item.panelZIndex,
    }

    if (item.options.type === 'drawer') {
      applyDrawerSize(style, item.options.placement, widthPx.value, heightPx.value, item)
      return style
    }

    style.width = widthPx.value === undefined ? formatCssUnit(item.options.width) : `${widthPx.value}px`
    style.minWidth = `${item.options.minWidth}px`
    style.minHeight = `${item.options.minHeight}px`

    if (heightPx.value !== undefined || item.options.height) {
      style.height = heightPx.value === undefined ? formatCssUnit(item.options.height) : `${heightPx.value}px`
    }

    if (placed.value) {
      style.left = `${leftPx.value}px`
      style.margin = '0'
      style.position = 'fixed'
      style.top = `${topPx.value}px`
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

    const rect = getResizedRect(resizeState, event, item.options.minWidth, item.options.minHeight)
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

    leftPx.value = clamp(dragState.left + event.clientX - dragState.startX, 0, window.innerWidth - dragState.width)
    topPx.value = clamp(dragState.top + event.clientY - dragState.startY, 0, window.innerHeight - dragState.height)
  }

  /** 停止拖拽并释放事件。 */
  function stopDrag(): void {
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
    widthPx.value = rect.width
    heightPx.value = rect.height
    leftPx.value = rect.left
    topPx.value = rect.top
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
    animating.value = true

    animationFrameId = window.requestAnimationFrame(() => {
      animationFrameId = 0
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
    return {
      left: 0,
      top: 0,
      width: Math.max(item.options.minWidth, window.innerWidth),
      height: Math.max(item.options.minHeight, window.innerHeight),
    }
  }

  onBeforeUnmount(() => {
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
 * 将 drawer 尺寸写入样式对象。
 *
 * @param style 待写入的样式对象。
 * @param placement drawer 弹出方向。
 * @param widthPx 当前宽度像素。
 * @param heightPx 当前高度像素。
 * @param item 当前弹层实例。
 */
function applyDrawerSize(style: CSSProperties, placement: OverlayPlacement, widthPx: number | undefined, heightPx: number | undefined, item: OverlayItem): void {
  if (placement === 'top' || placement === 'bottom') {
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
 * @returns 返回 resize 后的矩形。
 */
function getResizedRect(state: ResizeState, event: PointerEvent, minWidth: number, minHeight: number): PanelRect {
  const deltaX = event.clientX - state.startX
  const deltaY = event.clientY - state.startY
  let width = state.width
  let height = state.height
  let left = state.left
  let top = state.top

  if (state.direction.includes('e')) {
    width = clamp(state.width + deltaX, minWidth, window.innerWidth - state.left)
  }

  if (state.direction.includes('s')) {
    height = clamp(state.height + deltaY, minHeight, window.innerHeight - state.top)
  }

  if (state.direction.includes('w')) {
    width = clamp(state.width - deltaX, minWidth, state.left + state.width)
    left = state.left + state.width - width
  }

  if (state.direction.includes('n')) {
    height = clamp(state.height - deltaY, minHeight, state.top + state.height)
    top = state.top + state.height - height
  }

  return { width, height, left, top }
}
