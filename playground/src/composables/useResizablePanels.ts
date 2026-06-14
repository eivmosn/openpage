import type { ComputedRef, Ref } from 'vue'
import { computed, onBeforeUnmount, shallowRef } from 'vue'

export interface ResizablePanels {
  activeDivider: Ref<boolean>
  panelFlexBasis: ComputedRef<Record<string, string>>
  isResizing: Ref<boolean>
  startResize: (event: PointerEvent) => void
}

/**
 * 创建两段式 flex 水平方向可拖拽面板状态。
 *
 * @param container 两段式面板容器元素引用。
 * @returns 返回面板 flex basis、拖拽状态和开始拖拽方法。
 */
export function useResizablePanels(container: Ref<HTMLElement | null>): ResizablePanels {
  const panelPercents = shallowRef<[number, number]>([35, 65])
  const activeDivider = shallowRef(false)
  const isResizing = computed(() => activeDivider.value)
  const panelFlexBasis = computed(() => ({
    '--playground-left-basis': `${panelPercents.value[0]}%`,
    '--playground-center-basis': `${panelPercents.value[1]}%`,
  }))
  let dragRect: DOMRectReadOnly | undefined
  let dragPercents: [number, number] = panelPercents.value
  let latestClientX = 0
  let animationFrame: number | undefined

  /**
   * 根据指针位置记录下一次面板更新。
   *
   * @param event 当前指针移动事件。
   */
  function handlePointerMove(event: PointerEvent): void {
    latestClientX = event.clientX
    schedulePanelUpdate()
  }

  /**
   * 停止拖拽并释放全局事件。
   */
  function stopResize(): void {
    const element = container.value

    cancelPanelUpdate()
    flushPanelUpdate()
    panelPercents.value = dragPercents
    activeDivider.value = false
    dragRect = undefined
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', stopResize)
    window.removeEventListener('pointercancel', stopResize)

    if (!element) {
      return
    }

    applyPanelPercents(element, dragPercents)
  }

  /**
   * 开始拖拽指定分割线。
   *
   * @param event 分割线上的指针按下事件。
   */
  function startResize(event: PointerEvent): void {
    const element = container.value

    if (!element || window.matchMedia('(max-width: 1100px)').matches) {
      return
    }

    event.preventDefault()
    dragRect = element.getBoundingClientRect()
    dragPercents = panelPercents.value
    latestClientX = event.clientX
    activeDivider.value = true
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', stopResize)
    window.addEventListener('pointercancel', stopResize)
  }

  /**
   * 安排下一帧执行面板宽度更新。
   */
  function schedulePanelUpdate(): void {
    if (animationFrame !== undefined) {
      return
    }

    animationFrame = requestAnimationFrame(flushPanelUpdate)
  }

  /**
   * 立即执行待处理的面板宽度更新。
   */
  function flushPanelUpdate(): void {
    animationFrame = undefined

    const element = container.value
    if (!element || !dragRect || !activeDivider.value) {
      return
    }

    dragPercents = getNextPanelPercents({
      clientX: latestClientX,
      percents: dragPercents,
      rect: dragRect,
    })
    applyPanelPercents(element, dragPercents)
  }

  /**
   * 取消未执行的动画帧更新。
   */
  function cancelPanelUpdate(): void {
    if (animationFrame === undefined) {
      return
    }

    cancelAnimationFrame(animationFrame)
    animationFrame = undefined
  }

  onBeforeUnmount(stopResize)

  return {
    activeDivider,
    panelFlexBasis,
    isResizing,
    startResize,
  }
}

interface NextPanelPercentsOptions {
  clientX: number
  percents: [number, number]
  rect: DOMRectReadOnly
}

/**
 * 根据拖拽位置计算下一组面板宽度百分比。
 *
 * @param options 计算面板宽度所需的拖拽上下文。
 * @returns 返回下一组左右面板宽度百分比。
 */
function getNextPanelPercents(options: NextPanelPercentsOptions): [number, number] {
  const pointerPercent = ((options.clientX - options.rect.left) / options.rect.width) * 100
  const nextLeft = clamp(pointerPercent, 18, 70)

  return [nextLeft, 100 - nextLeft]
}

/**
 * 将面板宽度百分比写入容器 CSS 变量。
 *
 * @param element 两段式面板容器元素。
 * @param percents 左右面板宽度百分比。
 */
function applyPanelPercents(element: HTMLElement, percents: [number, number]): void {
  element.style.setProperty('--playground-left-basis', `${percents[0]}%`)
  element.style.setProperty('--playground-center-basis', `${percents[1]}%`)
}

/**
 * 将数值限制在指定区间内。
 *
 * @param value 需要限制的数值。
 * @param minimum 最小值。
 * @param maximum 最大值。
 * @returns 返回限制后的数值。
 */
function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}
